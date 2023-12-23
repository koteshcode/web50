import json

from django.core.paginator import Paginator
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Follower, Post
from django import forms

class PostForm(forms.Form):
    post = forms.CharField(max_length=255)

def index(request):
    posts = Post.objects.all()
    return render(request, "network/index.html", {
        "posts": posts
    })


def follow(request, user_id):
    following = User.objects.get(id=user_id)
    follower = Follower.objects.filter(user=following, follower=request.user)
    
    return HttpResponse(reverse("index"))


@login_required
def following(request):
    return render(request, "network/following.html")


@login_required
def following_posts(request):
    user = User.objects.get(username=request.user)
    user_following = user.user_follower.values_list("user", flat=True)
    posts = Post.objects.filter(user__in=user_following)
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize() for post in posts], safe=False, status=201)
    

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def posts(request):
    posts = Post.objects.all()
    posts = posts.order_by("-timestamp").all()
    paginator = Paginator(posts, 3)  # Show 10 posts per page
    page_number = request.GET.get("page")
    print(page_number)
    print(f"Page counts {paginator.num_pages}")
    page_obj = paginator.get_page(page_number)
    serialized_posts = [post.serialize() for post in page_obj]
    return JsonResponse({
        "data":serialized_posts,
        "meta": {
            "pagescount": paginator.num_pages
            },
        }, safe=False, status=201)


def posts_user(request, user_id):
    posts = Post.objects.filter(user=user_id)
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize() for post in posts], safe=False, status=201)


@csrf_exempt
@login_required
def posts_user_like(request, post_id):
    return HttpResponseRedirect(reverse("like_post", kwargs={"post_id": post_id}))

@csrf_exempt
@login_required
def new_post(request):
    if request.method == "POST":
        if request.POST["message"] == "":
            print('empty')
            messages.error(request, "Post cant be emty")
            return render(request, "network/index.html", {
                "message": "Post can`t be empty"
            })
        post = Post(post=request.POST["message"], user=request.user)
        post.save()
        return HttpResponseRedirect(reverse("index"))
    else:
        return HttpResponseRedirect(reverse("index"))


@csrf_exempt
@login_required
def like_post(request, post_id):
    user = request.user
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    
    if request.method == 'PUT':
        data = json.loads(request.body)
        
        if data.get("type") == "Modify like":
            # if user has liked
            if data.get("liked") == True:
                post.likes.add(user)
                post.save()
                return JsonResponse({
                    "data": post.serialize(),
                    "message": "Post liked!"}, status=201)
            elif data.get("liked") == False:
                post.likes.remove(user)
                post.save()
                return JsonResponse({
                    "data": post.serialize(),
                    "message": "Post unliked!"}, status=201)
        elif data.get('type') == "Edit post" and post_id == post.id:
            post.post = data.get("post")
            post.save()
            return JsonResponse({
                "data": post.serialize(),
                "message": "Succes"}, status=201)
        else:
            return JsonResponse({"error": "Something went wrong"}, status=403)
    elif request.method == "GET":
        return JsonResponse({
            "data": post.serialize(),
            "message": "Post!"}, status=201)

    # Handle other HTTP methods if needed
    return JsonResponse({"error": "Invalid request method."}, status=400)


@csrf_exempt
def user(request, user_id):
    # Get data of looked user
    user_look = User.objects.get(id=user_id)
    user_look_followers = Follower.objects.filter(user=user_look).count()
    # When load page with GET
    if request.method == "GET":
        user_look_posts = Post.objects.filter(id=user_id)
        # Count followers and following
        
        user_look_follows = Follower.objects.filter(follower=user_id).count()
        # Check if user follows looked user
        if request.user.is_authenticated:
            is_follow = Follower.objects.filter(user=user_id, follower=request.user).exists()
            if not is_follow and f"{request.user}" != f"{user_look.username}":
                follow = True
            elif is_follow:
                follow = False
            else: 
                follow = None
            return render(request, "network/user.html", {
                "follow": follow,
                "user_look": user_look,
                "user_look_posts": user_look_posts,
                "followers": user_look_followers,
                "follows": user_look_follows
            })
        else:
                return render(request, "network/user.html", {
                "follow": None,
                "user_look": user_look,
                "user_look_posts": user_look_posts,
                "followers": user_look_followers,
                "follows": user_look_follows
            })
    # When request to put changes in db
    elif request.method == "PUT":
        data = json.loads(request.body)

        # If whant to follow/unfollow
        if data.get('follow') == True:
            if Follower.objects.filter(user=user_id, follower=request.user).exists():
                return JsonResponse({"message": "Already follows!"}, status=403)
            Follower.objects.create(user=user_look, follower=request.user)
            return JsonResponse({"followers": user_look_followers, "message": "Follows."}, status=201)
        else:
            Follower.objects.filter(user=user_look, follower=request.user).delete()
            return JsonResponse({"followers": user_look_followers, "message": "Unfollows."}, status=201)
    # Return error if method not supports
    return JsonResponse({"error": "Invalid request method."}, status=405)