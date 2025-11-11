from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView
)

from .views import RegisterView, ListUsersView, DetailUsersView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("users/", ListUsersView.as_view(), name="users"),
    path("users/<uuid:user_id>", DetailUsersView.as_view(), name="users"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
