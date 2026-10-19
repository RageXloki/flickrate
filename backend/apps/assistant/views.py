from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import ask_assistant


class AssistantView(APIView):
    """POST /api/assistant/  body: {query: "..."}

    Public endpoint (works for logged-out visitors too, per spec section
    28). Uses the Anthropic API server-side when ANTHROPIC_API_KEY is
    configured; otherwise falls back to a deterministic metadata parser.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "assistant"

    def post(self, request):
        query = request.data.get("query", "")
        result = ask_assistant(query, user=request.user if request.user.is_authenticated else None)
        return Response(result)
