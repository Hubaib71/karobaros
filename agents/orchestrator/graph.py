import sys
from pathlib import Path
from typing import TypedDict

sys.path.append(str(Path(__file__).resolve().parents[2]))

from langgraph.graph import END, START, StateGraph

from agents.orchestrator.parser import OrderIntent, parse_message
from agents.sales_agent.agent import process_sales_request
from agents.inventory_agent.agent import check_inventory
from agents.order_agent.agent import create_pending_order
from app.db.session import SessionLocal


class AgentState(TypedDict, total=False):
    message: str
    intent: OrderIntent
    next_agent: str
    sales_result: dict
    inventory_result: dict
    order_result: dict


def parse_intent(state: AgentState) -> AgentState:
    intent = parse_message(state["message"])

    return {
        "intent": intent,
        "next_agent": (
            "sales_agent"
            if intent.intent == "create_order"
            else "unknown"
        ),
    }


def route_agent(state: AgentState) -> str:
    return state["next_agent"]


def sales_agent(state: AgentState) -> AgentState:
    intent = state["intent"]

    db = SessionLocal()

    try:
        result = process_sales_request(
            db=db,
            product_name=intent.product,
            quantity=intent.quantity,
            size=intent.size,
            color=intent.color,
        )
    finally:
        db.close()

    return {
        "sales_result": result,
        "next_agent": "inventory_agent",
    }


def inventory_agent(state: AgentState) -> AgentState:
    intent = state["intent"]
    sales_result = state["sales_result"]

    if not sales_result.get("success"):
        product_id = sales_result.get("product_id")

        if not product_id:
            return {
                "inventory_result": sales_result,
                "next_agent": "completed",
            }
    else:
        product_id = sales_result["product_id"]

    db = SessionLocal()

    try:
        result = check_inventory(
            db=db,
            product_id=product_id,
            requested_quantity=intent.quantity,
        )
    finally:
        db.close()

    return {
        "inventory_result": result,
        "next_agent": (
            "order_agent"
            if result.get("sufficient")
            else "completed"
        ),
    }


def order_agent(state: AgentState) -> AgentState:
    intent = state["intent"]
    sales_result = state["sales_result"]

    db = SessionLocal()

    try:
        result = create_pending_order(
            db=db,
            customer_id=1,
            product_id=sales_result["product_id"],
            quantity=intent.quantity,
            delivery_city=intent.delivery_city,
        )
    finally:
        db.close()

    return {
        "order_result": result,
        "next_agent": "completed",
    }


def route_after_sales(state: AgentState) -> str:
    return state["next_agent"]


def route_after_inventory(state: AgentState) -> str:
    return state["next_agent"]


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("parse_intent", parse_intent)
    graph.add_node("sales_agent", sales_agent)
    graph.add_node("inventory_agent", inventory_agent)
    graph.add_node("order_agent", order_agent)

    graph.add_edge(START, "parse_intent")

    graph.add_conditional_edges(
        "parse_intent",
        route_agent,
        {
            "sales_agent": "sales_agent",
            "unknown": END,
        },
    )

    graph.add_edge("sales_agent", "inventory_agent")

    graph.add_conditional_edges(
        "inventory_agent",
        route_after_inventory,
        {
            "order_agent": "order_agent",
            "completed": END,
        },
    )

    graph.add_edge("order_agent", END)

    return graph.compile()


orchestrator = build_graph()