from rest_framework.routers import DefaultRouter
from .views import MaintenanceViewSet

router = DefaultRouter()

router.register("", MaintenanceViewSet)

urlpatterns = router.urls