from rest_framework import generics
from django.contrib.auth import get_user_model

from accounts.serializers import RegisterSerializer, ListUserSerializer
from accounts.permissions import IsSupervisor


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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
