from pydantic import BaseModel


class OrderIntent(BaseModel):
    intent: str
    product: str | None = None
    size: str | None = None
    color: str | None = None
    quantity: int | None = None
    delivery_city: str | None = None


def parse_message(message: str) -> OrderIntent:
    text = message.lower().strip()
    words = text.replace(",", " ").split()

    number_words = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10,
    }

    quantity = None

    for word in words:
        if word.isdigit():
            quantity = int(word)
            break
        if word in number_words:
            quantity = number_words[word]
            break

    size = None

    size_aliases = {
        "extra small": "XS",
        "extra-small": "XS",
        "small": "S",
        "medium": "M",
        "large": "L",
        "extra large": "XL",
        "extra-large": "XL",
        "xxl": "XXL",
        "xl": "XL",
        "xs": "XS",
        "l": "L",
        "m": "M",
        "s": "S",
    }

    for phrase, normalized_size in size_aliases.items():
        if phrase in text:
            size = normalized_size
            break

    color = None

    for possible_color in [
        "black",
        "white",
        "navy",
        "grey",
        "gray",
        "blue",
    ]:
        if possible_color in text:
            color = possible_color
            break

    product = None

    if (
        "t-shirt" in text
        or "tshirt" in text
        or "t shirt" in text
        or "tee" in text
    ):
        product = "Classic T-Shirt"
    elif "polo" in text:
        product = "Premium Polo"
    elif "jeans" in text:
        product = "Slim Jeans"
    elif "hoodie" in text:
        product = "Winter Hoodie"

    delivery_city = None

    for city in [
        "lahore",
        "islamabad",
        "rawalpindi",
        "karachi",
        "peshawar",
    ]:
        if city in text:
            delivery_city = city.title()
            break

    order_words = [
        "chahiye",
        "chaahiye",
        "lena",
        "lenay",
        "leina",
        "do",
        "dena",
        "bhej",
        "bhejna",
        "order",
        "buy",
        "want",
        "need",
    ]

    is_order_request = any(
        word in text
        for word in order_words
    )

    intent = (
        "create_order"
        if product and quantity and is_order_request
        else "unknown"
    )

    return OrderIntent(
        intent=intent,
        product=product,
        size=size,
        color=color,
        quantity=quantity,
        delivery_city=delivery_city,
    )
