from app.db.session import SessionLocal
from app.models import Customer, Product, Inventory


def seed_database():
    db = SessionLocal()

    try:
        # Products
        products = [
            Product(
                name="Classic T-Shirt",
                sku="TSH-BLK-L",
                category="T-Shirts",
                price=1800,
            ),
            Product(
                name="Classic T-Shirt",
                sku="TSH-WHT-M",
                category="T-Shirts",
                price=1800,
            ),
            Product(
                name="Premium Polo",
                sku="POL-NAV-L",
                category="Polo",
                price=2500,
            ),
            Product(
                name="Premium Polo",
                sku="POL-BLK-XL",
                category="Polo",
                price=2500,
            ),
            Product(
                name="Slim Jeans",
                sku="JNS-BLU-32",
                category="Jeans",
                price=3500,
            ),
            Product(
                name="Slim Jeans",
                sku="JNS-BLK-34",
                category="Jeans",
                price=3500,
            ),
            Product(
                name="Winter Hoodie",
                sku="HOD-GRY-L",
                category="Hoodies",
                price=4000,
            ),
            Product(
                name="Winter Hoodie",
                sku="HOD-BLK-XL",
                category="Hoodies",
                price=4000,
            ),
        ]

        db.add_all(products)
        db.flush()

        # Inventory
        inventory = [
            Inventory(product_id=products[0].id, quantity=25, low_stock_threshold=5),
            Inventory(product_id=products[1].id, quantity=12, low_stock_threshold=5),
            Inventory(product_id=products[2].id, quantity=8, low_stock_threshold=5),
            Inventory(product_id=products[3].id, quantity=15, low_stock_threshold=5),
            Inventory(product_id=products[4].id, quantity=6, low_stock_threshold=5),
            Inventory(product_id=products[5].id, quantity=3, low_stock_threshold=5),
            Inventory(product_id=products[6].id, quantity=18, low_stock_threshold=5),
            Inventory(product_id=products[7].id, quantity=4, low_stock_threshold=5),
        ]

        db.add_all(inventory)

        # Customers
        customers = [
            Customer(name="Ali Khan", city="Lahore"),
            Customer(name="Ahmed Raza", city="Islamabad"),
            Customer(name="Usman Malik", city="Rawalpindi"),
            Customer(name="Hamza Sheikh", city="Lahore"),
        ]

        db.add_all(customers)

        db.commit()

        print("Database seeded successfully")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()