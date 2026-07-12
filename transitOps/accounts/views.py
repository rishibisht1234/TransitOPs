from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import User
from .serializers import UserRegisterSerializer


class UserRegisterAPIView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer