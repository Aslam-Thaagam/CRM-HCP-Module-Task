"""
Run once to seed sample HCPs:
  python seed.py
"""
import asyncio
from database import AsyncSessionLocal, init_db
from models import HCP, SpecialtyEnum


SAMPLE_HCPS = [
    {"first_name": "Sarah",   "last_name": "Chen",      "specialty": SpecialtyEnum.oncology,        "institution": "Mass General Hospital",          "city": "Boston",       "state": "MA", "tier": 1},
    {"first_name": "James",   "last_name": "Patel",     "specialty": SpecialtyEnum.oncology,        "institution": "MD Anderson Cancer Center",      "city": "Houston",      "state": "TX", "tier": 1},
    {"first_name": "Emily",   "last_name": "Rodriguez", "specialty": SpecialtyEnum.cardiology,      "institution": "Cleveland Clinic",               "city": "Cleveland",    "state": "OH", "tier": 2},
    {"first_name": "Michael", "last_name": "Thompson",  "specialty": SpecialtyEnum.endocrinology,   "institution": "Mayo Clinic",                    "city": "Rochester",    "state": "MN", "tier": 1},
    {"first_name": "Priya",   "last_name": "Sharma",    "specialty": SpecialtyEnum.pulmonology,     "institution": "Johns Hopkins Hospital",         "city": "Baltimore",    "state": "MD", "tier": 2},
    {"first_name": "David",   "last_name": "Kim",       "specialty": SpecialtyEnum.neurology,       "institution": "UCSF Medical Center",            "city": "San Francisco","state": "CA", "tier": 2},
    {"first_name": "Lisa",    "last_name": "Johnson",   "specialty": SpecialtyEnum.rheumatology,    "institution": "Hospital for Special Surgery",   "city": "New York",     "state": "NY", "tier": 1},
    {"first_name": "Robert",  "last_name": "Williams",  "specialty": SpecialtyEnum.gastroenterology,"institution": "Northwestern Memorial Hospital",  "city": "Chicago",      "state": "IL", "tier": 2},
    {"first_name": "Anjali",  "last_name": "Mehta",     "specialty": SpecialtyEnum.dermatology,     "institution": "Stanford Medical Center",        "city": "Palo Alto",    "state": "CA", "tier": 2},
    {"first_name": "Kevin",   "last_name": "Lee",       "specialty": SpecialtyEnum.internal_medicine,"institution": "Brigham and Women's Hospital",  "city": "Boston",       "state": "MA", "tier": 3},
    {"first_name": "Maria",   "last_name": "Garcia",    "specialty": SpecialtyEnum.oncology,        "institution": "Memorial Sloan Kettering",       "city": "New York",     "state": "NY", "tier": 1},
    {"first_name": "Thomas",  "last_name": "Brown",     "specialty": SpecialtyEnum.cardiology,      "institution": "Duke University Medical Center", "city": "Durham",       "state": "NC", "tier": 2},
    {"first_name": "Jennifer","last_name": "Davis",     "specialty": SpecialtyEnum.endocrinology,   "institution": "Joslin Diabetes Center",         "city": "Boston",       "state": "MA", "tier": 2},
    {"first_name": "William", "last_name": "Martinez",  "specialty": SpecialtyEnum.general_practice,"institution": "Private Practice",               "city": "Dallas",       "state": "TX", "tier": 3},
    {"first_name": "Susan",   "last_name": "Anderson",  "specialty": SpecialtyEnum.oncology,        "institution": "Dana-Farber Cancer Institute",   "city": "Boston",       "state": "MA", "tier": 1},
]


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        for data in SAMPLE_HCPS:
            hcp = HCP(**data)
            db.add(hcp)
        await db.commit()
        print(f"Seeded {len(SAMPLE_HCPS)} HCPs successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
