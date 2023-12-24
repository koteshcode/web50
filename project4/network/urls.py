
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("follow/<int:user_id>", views.follow, name="follow"),
    path("following", views.following, name="following"),
    path("following_posts/", views.following_posts, name="following_posts"),
    path("new_post", views.new_post, name="new_post"),
    path("accounts/login/", views.login_view, name="login"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("like_post/<int:post_id>", views.like_post, name="like_post"),
    path("user/like_post/<int:post_id>", views.posts_user_like, name="user_like_post"),
    path("posts/", views.posts, name="posts"),
    path("register", views.register, name="register"),
    path("user/<int:user_id>", views.user, name="user"),
    path("user/posts_user/<int:user_id>", views.posts_user, name="posts_user")
]
