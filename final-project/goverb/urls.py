from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("explore", views.verbs, name="explore"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("regular", views.verbs, name='regular'),
    path("repeat", views.verbs, name="repeat"),
    path("update", views.verbs_update, name="verbs_update")
]