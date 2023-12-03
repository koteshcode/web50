from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("archive/<str:title>", views.archive, name="archive"),
    path("categories", views.categories, name="categories"),
    path("<str:category>", views.category, name="category"),
    path("close-listing", views.close_listing, name="close-listing"),
    path("create", views.create, name="create"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("watchlist", views.watchlist, name="watchlist"),
    path("listing/<str:title>", views.listing, name="listing")
]
