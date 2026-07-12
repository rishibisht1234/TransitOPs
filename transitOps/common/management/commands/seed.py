import random
from decimal import Decimal
from datetime import timedelta

from faker import Faker

from django.core.management.base import BaseCommand
from django.utils import timezone

# pyrefly: ignore [missing-import]
from accounts.models import User
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from drivers.models import Driver
# pyrefly: ignore [missing-import]
from trips.models import Trip
# pyrefly: ignore [missing-import]
from maintenance.models import Maintenance
# pyrefly: ignore [missing-import]
from expenses.models import Expense


fake = Faker("en_IN")


CITIES = [
    "Delhi",
    "Mumbai",
    "Pune",
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jaipur",
    "Ahmedabad",
    "Lucknow",
    "Hyderabad",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Indore",
    "Nagpur",
]


VEHICLE_NAMES = [

    "Ashok Leyland Dost",

    "Tata Ace",

    "Mahindra Bolero Pickup",

    "Eicher Pro",

    "BharatBenz 3523",

    "Ashok Leyland 1616",

    "Volvo FM",

    "Scania R500",

    "Mahindra Blazo",

    "Tata Prima",

    "Force Traveller",

    "Tata Signa",

    "Eicher Skyline",

    "Volvo FH",

    "Ashok Leyland Bada Dost",

]


ISSUES = [

    "Oil Change",

    "Brake Repair",

    "Tyre Replacement",

    "Engine Service",

    "Battery Replacement",

    "Clutch Repair",

]


class Command(BaseCommand):

    help = "Seed TransitOps database"

    def handle(self, *args, **kwargs):

        self.stdout.write(self.style.WARNING(
            "Removing old demo data..."
        ))

        Expense.objects.all().delete()
        Maintenance.objects.all().delete()
        Trip.objects.all().delete()
        Driver.objects.all().delete()
        Vehicle.objects.all().delete()

        User.objects.exclude(
            email="admin@test.com"
        ).delete()

        admin, created = User.objects.get_or_create(

            email="admin@test.com",

            defaults={

                "first_name": "Admin",

                "last_name": "User",

                "role": User.Role.ADMIN,

                "is_staff": True,

                "is_superuser": True,

            }

        )

        admin.set_password("admin123")
        admin.save()

        self.stdout.write(self.style.SUCCESS(
            "Creating Users..."
        ))

        roles = [

            User.Role.FLEET_MANAGER,

            User.Role.DISPATCHER,

            User.Role.SAFETY_OFFICER,

            User.Role.FINANCIAL_ANALYST,

        ]

        users = []

        for role in roles:

            for i in range(2):

                user = User.objects.create_user(

                    email=f"{role.lower()}{i}@test.com",

                    password="12345678",

                    first_name=fake.first_name(),

                    last_name=fake.last_name(),

                    role=role,

                )

                users.append(user)

        self.stdout.write(self.style.SUCCESS(
            "Creating Vehicles..."
        ))

        vehicles = []

        for i in range(30):

            vehicle = Vehicle.objects.create(

                registration_number=f"PB08AB{1000+i}",

                vehicle_name=random.choice(
                    VEHICLE_NAMES
                ),

                vehicle_type=random.choice(
                    Vehicle.VehicleType.values
                ),

                maximum_load_capacity=random.randint(
                    500,
                    5000,
                ),

                odometer=random.randint(
                    10000,
                    120000,
                ),

                acquisition_cost=Decimal(
                    random.randint(
                        600000,
                        3000000,
                    )
                ),

                status=Vehicle.VehicleStatus.AVAILABLE,

            )

            vehicles.append(vehicle)

        self.stdout.write(self.style.SUCCESS(
            "Creating Drivers..."
        ))

        drivers = []

        for i in range(25):

            driver = Driver.objects.create(

                name=fake.name(),

                license_number=f"DL{i+10000}",

                license_category=random.choice(
                    Driver.LicenseCategory.values
                ),

                license_expiry_date=(
                    timezone.now().date()
                    + timedelta(
                        days=random.randint(
                            300,
                            2000,
                        )
                    )
                ),

                contact_number=fake.msisdn()[:10],

                safety_score=random.randint(
                    75,
                    100,
                ),

                status=Driver.DriverStatus.AVAILABLE,

            )

            drivers.append(driver)

# ****************************************************

        self.stdout.write(
            self.style.SUCCESS("Creating Trips...")
        )

        trips = []

        available_vehicles = vehicles.copy()
        available_drivers = drivers.copy()

        # ----------------------------
        # 15 DISPATCHED TRIPS
        # ----------------------------

        for _ in range(15):

            vehicle = random.choice(available_vehicles)
            driver = random.choice(available_drivers)

            available_vehicles.remove(vehicle)
            available_drivers.remove(driver)

            source = random.choice(CITIES)

            destination = random.choice(
                [c for c in CITIES if c != source]
            )

            planned_distance = random.randint(80, 800)

            actual_distance = planned_distance + random.randint(
                -20,
                30,
            )

            trip = Trip.objects.create(

                vehicle=vehicle,

                driver=driver,

                source=source,

                destination=destination,

                cargo_weight=random.randint(
                    100,
                    int(vehicle.maximum_load_capacity)
                ),

                planned_distance=planned_distance,

                revenue=random.randint(
                    10000,
                    80000,
                ),

                status=Trip.Status.DISPATCHED,

                start_time=timezone.now()
                - timedelta(
                    hours=random.randint(1, 24)
                ),

            )

            vehicle.status = Vehicle.VehicleStatus.ON_TRIP
            vehicle.save()

            driver.status = Driver.DriverStatus.ON_TRIP
            driver.save()

            trips.append(trip)

        # ----------------------------
        # 25 COMPLETED TRIPS
        # ----------------------------

        remaining_vehicles = [
            v for v in vehicles
            if v.status == Vehicle.VehicleStatus.AVAILABLE
        ]

        remaining_drivers = [
            d for d in drivers
            if d.status == Driver.DriverStatus.AVAILABLE
        ]

        for _ in range(25):

            vehicle = random.choice(remaining_vehicles)
            driver = random.choice(remaining_drivers)

            source = random.choice(CITIES)

            destination = random.choice(
                [c for c in CITIES if c != source]
            )

            planned_distance = random.randint(
                100,
                1000,
            )

            actual_distance = planned_distance + random.randint(
                -30,
                40,
            )

            fuel = round(
                actual_distance / random.uniform(8, 18),
                2,
            )

            vehicle.odometer += actual_distance
            vehicle.save()

            trip = Trip.objects.create(

                vehicle=vehicle,

                driver=driver,

                source=source,

                destination=destination,

                cargo_weight=random.randint(
                    100,
                    int(vehicle.maximum_load_capacity)
                ),

                planned_distance=planned_distance,

                actual_distance=actual_distance,

                fuel_consumed=fuel,

                revenue=random.randint(
                    15000,
                    120000,
                ),

                status=Trip.Status.COMPLETED,

                start_time=timezone.now()
                - timedelta(
                    days=random.randint(5, 40)
                ),

                end_time=timezone.now()
                - timedelta(
                    days=random.randint(1, 4)
                ),

            )

            trips.append(trip)

        # ----------------------------
        # 10 DRAFT TRIPS
        # ----------------------------

        for _ in range(10):

            vehicle = random.choice(remaining_vehicles)
            driver = random.choice(remaining_drivers)

            source = random.choice(CITIES)

            destination = random.choice(
                [c for c in CITIES if c != source]
            )

            trip = Trip.objects.create(

                vehicle=vehicle,

                driver=driver,

                source=source,

                destination=destination,

                cargo_weight=random.randint(
                    100,
                    int(vehicle.maximum_load_capacity)
                ),

                planned_distance=random.randint(
                    100,
                    700,
                ),

                revenue=random.randint(
                    12000,
                    60000,
                ),

                status=Trip.Status.DRAFT,

            )

            trips.append(trip)
        
# ***********************************
        self.stdout.write(
            self.style.SUCCESS("Creating Maintenance Records...")
        )

        maintenance_vehicles = random.sample(
            [v for v in vehicles if v.status == Vehicle.VehicleStatus.AVAILABLE],
            10
        )

        for i, vehicle in enumerate(maintenance_vehicles):

            if i < 5:

                status = Maintenance.MaintenanceStatus.OPEN
                vehicle.status = Vehicle.VehicleStatus.IN_SHOP
                vehicle.save()

            else:

                status = Maintenance.MaintenanceStatus.CLOSED

            Maintenance.objects.create(

                vehicle=vehicle,

                issue=random.choice(ISSUES),

                description=fake.sentence(),

                cost=random.randint(
                    3000,
                    20000,
                ),

                status=status,

            )

        self.stdout.write(
            self.style.SUCCESS("Creating Expenses...")
        )

        expense_categories = [

            Expense.Category.FUEL,

            Expense.Category.FUEL,

            Expense.Category.FUEL,

            Expense.Category.FUEL,

            Expense.Category.MAINTENANCE,

            Expense.Category.MAINTENANCE,

            Expense.Category.TOLL,

            Expense.Category.TOLL,

            Expense.Category.PARKING,

            Expense.Category.OTHER,

        ]

        completed_trips = Trip.objects.filter(
            status=Trip.Status.COMPLETED
        )

        for _ in range(120):

            category = random.choice(expense_categories)

            trip = random.choice(completed_trips)

            if category == Expense.Category.FUEL:

                amount = random.randint(
                    3000,
                    12000,
                )

            elif category == Expense.Category.MAINTENANCE:

                amount = random.randint(
                    4000,
                    25000,
                )

            elif category == Expense.Category.TOLL:

                amount = random.randint(
                    300,
                    2500,
                )

            elif category == Expense.Category.PARKING:

                amount = random.randint(
                    100,
                    1000,
                )

            else:

                amount = random.randint(
                    500,
                    5000,
                )

            Expense.objects.create(

                vehicle=trip.vehicle,

                trip=trip,

                category=category,

                amount=amount,

                remarks=fake.sentence(),

            )

        self.stdout.write(
            self.style.SUCCESS(
                "Generating Additional Driver States..."
            )
        )

        available_drivers = Driver.objects.filter(
            status=Driver.DriverStatus.AVAILABLE
        )

        available_drivers = list(available_drivers)

        random.shuffle(available_drivers)

        for driver in available_drivers[:3]:

            driver.status = Driver.DriverStatus.OFF_DUTY
            driver.save()

        for driver in available_drivers[3:5]:

            driver.status = Driver.DriverStatus.SUSPENDED
            driver.save()

        self.stdout.write("")
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS("Database Seed Completed"))
        self.stdout.write("=" * 50)

        self.stdout.write(f"Users          : {User.objects.count()}")
        self.stdout.write(f"Vehicles       : {Vehicle.objects.count()}")
        self.stdout.write(f"Drivers        : {Driver.objects.count()}")
        self.stdout.write(f"Trips          : {Trip.objects.count()}")
        self.stdout.write(f"Maintenance    : {Maintenance.objects.count()}")
        self.stdout.write(f"Expenses       : {Expense.objects.count()}")

        self.stdout.write("=" * 50)      


    



# import random
# from decimal import Decimal
# from datetime import timedelta

# from faker import Faker
# from django.core.management.base import BaseCommand
# from django.utils import timezone

# # pyrefly: ignore [missing-import]
# from accounts.models import User
# # pyrefly: ignore [missing-import]
# from vehicles.models import Vehicle
# # pyrefly: ignore [missing-import]
# from drivers.models import Driver
# # pyrefly: ignore [missing-import]
# from trips.models import Trip
# # pyrefly: ignore [missing-import]
# from maintenance.models import Maintenance
# # pyrefly: ignore [missing-import]
# from expenses.models import Expense


# fake = Faker()


# class Command(BaseCommand):

#     help = "Populate TransitOps database with demo data"

#     def handle(self, *args, **kwargs):

#         self.stdout.write(self.style.SUCCESS("Creating Demo Data..."))

#         # -----------------------------
#         # USERS
#         # -----------------------------

#         if not User.objects.filter(email="admin@test.com").exists():
#             User.objects.create_superuser(
#                 email="admin@test.com",
#                 password="admin123",
#                 first_name="Admin",
#                 last_name="User",
#             )

#         # -----------------------------
#         # VEHICLES
#         # -----------------------------

#         vehicles = []

#         for i in range(10):

#             vehicle = Vehicle.objects.create(

#                 registration_number=f"PB08AB10{i}",

#                 vehicle_name=f"Vehicle-{i+1}",

#                 vehicle_type=random.choice(
#                     Vehicle.VehicleType.values
#                 ), 

#                 maximum_load_capacity=random.randint(500, 5000),

#                 odometer=random.randint(10000, 90000),

#                 acquisition_cost=Decimal(
#                     random.randint(600000, 2500000)
#                 ),

#                 status=Vehicle.VehicleStatus.AVAILABLE,

#             )

#             vehicles.append(vehicle)

#         # -----------------------------
#         # DRIVERS
#         # -----------------------------

#         drivers = []

#         for i in range(10):

#             driver = Driver.objects.create(

#                 name=fake.name(),

#                 license_number=f"DL{i+1000}",

#                 license_category=random.choice(
#                     Driver.LicenseCategory.values
#                 ),

#                 license_expiry_date=timezone.now().date()
#                 + timedelta(days=random.randint(500, 1500)),

#                 contact_number=fake.msisdn()[:10],

#                 safety_score=random.randint(70, 100),

#                 status=Driver.DriverStatus.AVAILABLE,

#             )

#             drivers.append(driver)

#         # -----------------------------
#         # TRIPS
#         # -----------------------------

#         trips = []

#         for i in range(8):

#             vehicle = vehicles[i]
#             driver = drivers[i]

#             trip = Trip.objects.create(

#                 vehicle=vehicle,

#                 driver=driver,

#                 source=fake.city(),

#                 destination=fake.city(),

#                 cargo_weight=random.randint(100, 400),

#                 planned_distance=random.randint(100, 600),

#                 actual_distance=random.randint(100, 600),

#                 fuel_consumed=random.randint(10, 50),

#                 revenue=random.randint(5000, 40000),

#                 status=random.choice(
#                     [
#                         Trip.Status.COMPLETED,
#                         Trip.Status.DRAFT,
#                     ]
#                 ),

#                 start_time=timezone.now()
#                 - timedelta(days=random.randint(1, 20)),

#                 end_time=timezone.now()

#             )

#             trips.append(trip)

#         # -----------------------------
#         # MAINTENANCE
#         # -----------------------------

#         for vehicle in vehicles[:3]:

#             Maintenance.objects.create(

#                 vehicle=vehicle,

#                 issue=random.choice(
#                     [
#                         "Oil Change",
#                         "Brake Repair",
#                         "Tyre Replacement",
#                     ]
#                 ),

#                 description=fake.sentence(),

#                 cost=random.randint(1000, 8000),

#                 status=random.choice(
#                     Maintenance.MaintenanceStatus.values
#                 )

#             )

#         # -----------------------------
#         # EXPENSES
#         # -----------------------------

#         for _ in range(20):

#             Expense.objects.create(

#                 vehicle=random.choice(vehicles),

#                 trip=random.choice(trips),

#                 category=random.choice(
#                     Expense.Category.values
#                 ),

#                 amount=random.randint(500, 7000),

#                 remarks=fake.sentence(),

#             )

#         self.stdout.write(
#             self.style.SUCCESS("Database populated successfully!")
#         )