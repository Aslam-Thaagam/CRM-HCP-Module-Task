"""
Resolves natural date/time strings into ISO format.
Handles: relative keywords, weekday names, ordinal dates (24th April),
         month names, next/last year, am/pm times, and period words.
"""

import re
from datetime import datetime, timedelta, date
from typing import Optional
import dateparser

NOW = datetime.now

WEEKDAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6,
}

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8,
    "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

TIME_MAP = {
    "morning": "09:00",
    "afternoon": "14:00",
    "evening": "18:00",
    "night": "20:00",
    "noon": "12:00",
    "midnight": "00:00",
    "dawn": "06:00",
    "dusk": "18:30",
}


def _last_weekday(target_wd: int, ref: datetime) -> date:
    delta = (ref.weekday() - target_wd) % 7 or 7
    return (ref - timedelta(days=delta)).date()


def _next_weekday(target_wd: int, ref: datetime) -> date:
    delta = (target_wd - ref.weekday()) % 7 or 7
    return (ref + timedelta(days=delta)).date()


def _this_weekday(target_wd: int, ref: datetime) -> date:
    delta = target_wd - ref.weekday()
    return (ref + timedelta(days=delta)).date()


def _smart_month_day(day: int, month: int, ref: datetime, prefer_future: bool = False) -> date:
    """
    Given a day+month, return the most sensible year.
    - If the date is within the next 14 days → use current year (near future)
    - If prefer_future and date is past → use next year
    - Otherwise → use current year (could be past, e.g. logging a past visit)
    """
    try:
        candidate = date(ref.year, month, day)
    except ValueError:
        return None

    if prefer_future and candidate < ref.date():
        try:
            return date(ref.year + 1, month, day)
        except ValueError:
            return candidate
    return candidate


def resolve_date(raw: Optional[str], ref: Optional[datetime] = None, prefer_future: bool = False) -> Optional[str]:
    """Convert any natural date string into YYYY-MM-DD."""
    if not raw:
        return None

    # Already ISO
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw.strip()):
        return raw.strip()

    ref = ref or NOW()
    s = raw.strip().lower()

    # ── Simple keywords ───────────────────────────────────────────────────────
    kw = {
        "today": 0, "now": 0, "current": 0,
        "tomorrow": 1, "tmr": 1, "tmrw": 1,
        "day after tomorrow": 2,
        "yesterday": -1, "yday": -1,
        "day before yesterday": -2,
    }
    for phrase, offset in kw.items():
        if s == phrase:
            return (ref + timedelta(days=offset)).date().isoformat()

    # ── "next year" / "this year" ─────────────────────────────────────────────
    if s in ("next year",):
        return date(ref.year + 1, ref.month, ref.day).isoformat()
    if s in ("last year",):
        return date(ref.year - 1, ref.month, ref.day).isoformat()

    # ── N days/weeks ago / from now ───────────────────────────────────────────
    m = re.fullmatch(r"(\d+)\s*(day|days|week|weeks)\s*ago", s)
    if m:
        n, unit = int(m.group(1)), m.group(2)
        return (ref - (timedelta(days=n) if "day" in unit else timedelta(weeks=n))).date().isoformat()

    m = re.fullmatch(r"(\d+)\s*(day|days|week|weeks)\s*(?:from now|later|ahead)", s)
    if m:
        n, unit = int(m.group(1)), m.group(2)
        return (ref + (timedelta(days=n) if "day" in unit else timedelta(weeks=n))).date().isoformat()

    # ── last/next/this weekday ────────────────────────────────────────────────
    m = re.fullmatch(r"(last|next|this)\s+(\w+)", s)
    if m and m.group(2) in WEEKDAY_MAP:
        mod, wd = m.group(1), WEEKDAY_MAP[m.group(2)]
        if mod == "last":   return _last_weekday(wd, ref).isoformat()
        if mod == "next":   return _next_weekday(wd, ref).isoformat()
        if mod == "this":   return _this_weekday(wd, ref).isoformat()

    # Bare weekday → most recent past occurrence
    if s in WEEKDAY_MAP:
        delta = (ref.weekday() - WEEKDAY_MAP[s]) % 7
        return (ref - timedelta(days=delta)).date().isoformat()

    # ── Ordinal date + month  e.g. "24th April", "April 24th", "24 April" ────
    ordinal = r"(\d{1,2})(?:st|nd|rd|th)?"
    month_names = "|".join(MONTH_MAP.keys())

    # "24th April [year]" or "24 April [year]"
    m = re.fullmatch(rf"{ordinal}\s+({month_names})(?:\s+(\d{{4}}))?", s)
    if m:
        day, month_name, year = int(m.group(1)), MONTH_MAP[m.group(2)], m.group(3)
        y = int(year) if year else None
        d = _smart_month_day(day, month_name, ref, prefer_future) if not y else date(y, month_name, day)
        return d.isoformat() if d else None

    # "April 24th [year]" or "April 24 [year]"
    m = re.fullmatch(rf"({month_names})\s+{ordinal}(?:\s+(\d{{4}}))?", s)
    if m:
        month_name, day, year = MONTH_MAP[m.group(1)], int(m.group(2)), m.group(3)
        y = int(year) if year else None
        d = _smart_month_day(day, month_name, ref, prefer_future) if not y else date(y, month_name, day)
        return d.isoformat() if d else None

    # "April [year]" — just a month (use 1st of that month)
    m = re.fullmatch(rf"({month_names})(?:\s+(\d{{4}}))?", s)
    if m:
        month_name, year = MONTH_MAP[m.group(1)], m.group(2)
        y = int(year) if year else ref.year
        return date(y, month_name, 1).isoformat()

    # ── dateparser fallback (no PREFER — let it decide naturally) ─────────────
    settings = {
        "RELATIVE_BASE": ref,
        "RETURN_AS_TIMEZONE_AWARE": False,
        "DATE_ORDER": "DMY",
    }
    if prefer_future:
        settings["PREFER_DATES_FROM"] = "future"

    parsed = dateparser.parse(raw, settings=settings)
    if parsed:
        return parsed.date().isoformat()

    return None


def resolve_time(raw: Optional[str], ref: Optional[datetime] = None) -> Optional[str]:
    """Convert any natural time string into HH:MM."""
    if not raw:
        return None

    if re.fullmatch(r"\d{2}:\d{2}", raw.strip()):
        return raw.strip()

    ref = ref or NOW()
    s = raw.strip().lower()

    if s in TIME_MAP:
        return TIME_MAP[s]

    # "7pm", "7:30pm", "10am", "10:30 am"
    m = re.fullmatch(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", s)
    if m:
        h, mins, meridiem = int(m.group(1)), int(m.group(2) or 0), m.group(3)
        if meridiem == "pm" and h != 12:
            h += 12
        elif meridiem == "am" and h == 12:
            h = 0
        return f"{h:02d}:{mins:02d}"

    # "N hours ago"
    m = re.fullmatch(r"(\d+)\s*hours?\s*ago", s)
    if m:
        return (ref - timedelta(hours=int(m.group(1)))).strftime("%H:%M")

    # "N minutes ago"
    m = re.fullmatch(r"(\d+)\s*min(?:utes?)?\s*ago", s)
    if m:
        return (ref - timedelta(minutes=int(m.group(1)))).strftime("%H:%M")

    # dateparser fallback
    parsed = dateparser.parse(raw, settings={"RELATIVE_BASE": ref, "RETURN_AS_TIMEZONE_AWARE": False})
    if parsed:
        return parsed.strftime("%H:%M")

    return None


def resolve_datetime_fields(extracted: dict, ref: Optional[datetime] = None) -> dict:
    """Resolve interaction_date and interaction_time in-place."""
    ref = ref or NOW()
    raw_date = extracted.get("interaction_date")
    raw_time = extracted.get("interaction_time")

    resolved = resolve_date(raw_date, ref)
    if resolved:
        extracted["interaction_date"] = resolved

    resolved_t = resolve_time(raw_time, ref)
    if resolved_t:
        extracted["interaction_time"] = resolved_t

    return extracted
