from rest_framework.routers import DefaultRouter

from .views import DriverViewSet

router = DefaultRouter()

router.register("", DriverViewSet)

urlpatterns = router.urls