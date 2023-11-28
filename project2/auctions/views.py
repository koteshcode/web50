from django import forms
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Item, Watchlist

class ItemForm(forms.Form):
    title = forms.CharField(max_length=64)
    image_url = forms.URLField(required=False)
    description = forms.CharField(widget=forms.Textarea(attrs={"cols": 50, "rows": 3}), max_length=200 )
    category = forms.CharField(max_length=16, required=False)
    bid = forms.IntegerField()


def index(request):
    return render(request, "auctions/index.html", {
        "items": Item.objects.all()
    })


def close_listing(request):
    item = Item.objects.get(title=request["close_listing"])
    return render(request, "auctions/close-listing.html")


def categories(request):
    return render(request, "auctions/index.html")

@login_required
def create(request):
    if request.method == "POST":
        f = ItemForm(request.POST)
        if f.is_valid():
            item = Item()
            
            item.title = f.cleaned_data["title"]
            item.image_url = f.cleaned_data["image_url"]
            item.description = f.cleaned_data["description"]
            item.category = f.cleaned_data["category"]
            item.bid = f.cleaned_data["bid"]
            item.seller = request.user
            item.save()
        return HttpResponseRedirect(reverse("index"))
    else:
        f = ItemForm()
        return render(request, "auctions/create.html", {
            "form": f
        })


def listing(request, title):
    item_in_watchlist = False
    # Get item from db
    listing = Item.objects.get(title=title)
    # Check if user has this listing in watchlist
    if request.user.is_authenticated:
        if listing.watchlists.filter(user=request.user).exists():
            item_in_watchlist = True
            print("true")

    return render(request, "auctions/listing.html", {
        "listing": listing,
        "item_in_watchlist": item_in_watchlist
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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")


@login_required
def watchlist(request):
    # If user went through POST
    if request.method == "POST":
        # Get item from db
        item = Item.objects.get(title=request.POST["watchlist"])
        
        # If this user has item in watchlist
        if item.watchlists.filter(user=request.user).exists():
            # Remove from watchlist
            print(f"remove {item.id} {item.title}")
            item.watchlists.filter(user=request.user).delete()
        
        if "close_listing" in request.POST:
            print("close listing")
        # If user has not item in watchlist
        else:
            print("save")
            # Save to watchlist
            watchlist = Watchlist(user=request.user, item=item)
            watchlist.save()
        return HttpResponseRedirect(reverse("watchlist"))
    # Render user watchlist
    user_list = Item.objects.filter(watchlists__user=request.user)
    return render(request, "auctions/watchlist.html", {
        "user_list": user_list
    })


def check_watchlist(user, item):
    return user.watchlists.filter(item=item).exists()