from rest_framework import generics
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema
from rest_framework import status

from accounts.serializers import (
    ProfileResponseSerializer, RegisterSerializer, ListUserSerializer,
    LoginSerializer
)
from accounts.permissions import IsSupervisor


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        print(username, password)
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response({
            "detail": "Login successful",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "role": user.role
            }
        })

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="Lax",
            max_age=3600
        )
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="Lax",
            max_age=7 * 24 * 3600
        )

        response.set_cookie("username", user.username,
                            httponly=False, samesite="Lax")
        response.set_cookie("role", user.role, httponly=False, samesite="Lax")

        return response


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={status.HTTP_200_OK: ProfileResponseSerializer},
        request=None
    )
    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "role": user.role
        })


@extend_schema(
    responses={
        status.HTTP_200_OK: {
            "type": "object",
            "properties": {"detail": {"type": "string",
                                      "example": "Logged out successfully."}}
        }
    },
    # Tell spectacular there is no request body expected
    request=None
)
class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Logged out successfully."})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class ListUsersView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = ListUserSerializer


class DetailUsersView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = ListUserSerializer
    lookup_field = "id"
    lookup_url_kwarg = "user_id"


class CreateAgentView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    queryset = User.objects.all()
    permission_classes = [IsSupervisor]

    def perform_create(self, serializer):
        serializer.save(role=User.Roles.AGENT)
