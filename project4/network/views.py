import json

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post
from django import forms

class PostForm(forms.Form):
    post = forms.CharField(max_length=255)

def index(request):
    posts = Post.objects.all()
    return render(request, "network/index.html", {
        "posts": posts
    })


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
    print('posts')
    print(request.user)
    posts = Post.objects.all()
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize() for post in posts], safe=False, status=201)


@login_required
def new_post(request):
    print('new post')
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