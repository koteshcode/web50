from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("edit", views.edit, name="edit"),
    path("search", views.search, name="search"),
    path("random", views.random, name="random"),
    path("create", views.create, name="create"),
    path("wiki/<str:title>", views.title, name="title")
]
