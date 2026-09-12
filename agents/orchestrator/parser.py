from pydantic import BaseModel


class OrderIntent(BaseModel):
    intent: str
    product: str | None = None
    size: str | None = None
    color: str | None = None
    quantity: int | None = None
    delivery_city: str | None = None


def parse_message(message: str) -> OrderIntent:
    """
    Temporary deterministic parser.

    This will later be replaced/extended with an LLM,
    while keeping the same structured output.
    """

    text = message.lower()

    quantity = None
    for word in text.split():
        if word.isdigit():
            quantity = int(word)
            break

    size = None
    for possible_size in ["xs", "s", "m", "l", "xl", "xxl"]:
        if possible_size in text.split():
            size = possible_size.upper()
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

    product = None
    if "t-shirt" in text or "tshirt" in text:
        product = "Classic T-Shirt"
    elif "polo" in text:
        product = "Premium Polo"
    elif "jeans" in text:
        product = "Slim Jeans"
    elif "hoodie" in text:
        product = "Winter Hoodie"

    return OrderIntent(
        intent="create_order" if product and quantity else "unknown",
        product=product,
        size=size,
        color=color,
        quantity=quantity,
        delivery_city=delivery_city,
    )