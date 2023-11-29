from django import forms
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Max
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Item, Bid, Watchlist

class ItemForm(forms.Form):
    title = forms.CharField(max_length=64)
    image_url = forms.URLField(required=False)
    description = forms.CharField(widget=forms.Textarea(attrs={"cols": 50, "rows": 3}), max_length=200 )
    category = forms.CharField(max_length=16, required=False)
    bid = forms.IntegerField()


def index(request):
    return render(request, "auctions/index.html", {
        "items": Item.objects.filter(is_active=True)
    })


def close_listing(request):
    if request.method == "POST":
    #if "close_listing" in request.POST:
    
        item = Item.objects.get(title=request.POST["close_listing"])

        # Get the highest bid for this item
        highest_bid = item.bids.aggregate(Max('user_bid'))['user_bid__max']

        # Get the user who made the highest bid
        user_with_highest_bid = None
        if highest_bid is not None:
            user_with_highest_bid = item.bids.get(user_bid=highest_bid).user

        print(f"close listing {item.title} is {user_with_highest_bid}")
    return render(request, "auctions/close-listing.html")


def categories(request):
    return render(request, "auctions/index.html")

@login_required
def create(request):
    if request.method == "POST":
        print("post")
        f = ItemForm(request.POST)
        if f.is_valid():
            item = Item()
            print("form valid")
            item.title = f.cleaned_data["title"]
            item.image_url = f.cleaned_data["image_url"]
            item.description = f.cleaned_data["description"]
            item.category = f.cleaned_data["category"]
            item.bid = f.cleaned_data["bid"]
            # If startin bid is negative
            if item.bid < 0:
                messages.error("Starting bid should be more than 0")
                return render(request, "auctions/create.htmel", {"form": f})
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
    # Check if listing is active
    if not listing.is_active:
        print("Listing no longer active")
        messages.error("Listing no longer active")
        return render(request, "auctions/archive.html", {
            "listing": listing
        })
    # Check if user has this listing in watchlist
    if request.user.is_authenticated:
        if listing.watchlists.filter(user=request.user).exists():
            item_in_watchlist = True

    # If user bet with POST
    if request.method == "POST":
        # Get value of new bid 
        try:
            new_bid = int(request.POST["new_bid"])
        except ValueError:
            messages.error(request, "Input your bet")
            return render(request, "auctions/listing.html", {
                "listing": listing,
                "item_in_watchlist": item_in_watchlist
            })
            
        # Check if bid is lower than current bid
        if new_bid <= listing.bid:
            # Return error message
            messages.error(request, "Your bid is lower than the current highest bid")
            return render(request, "auctions/listing.html", {
                "listing": listing,
                "item_in_wathchlist": item_in_watchlist
            })
        # Add new bid to list of bids
        bid = Bid(item=listing, user=request.user, user_bid = new_bid)
        bid.save()
        # Assign new bid to listing and save
        listing.bid = new_bid
        listing.save()
        # Return listing with new bid
        return render(request, "auctions/listing.html", {
            "listing": listing,
            "item_in_watchlist": item_in_watchlist
        })
    # Render current listing
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