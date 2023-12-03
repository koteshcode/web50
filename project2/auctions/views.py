import decimal

from django import forms
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Max
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Comment, Bid, Item, Watchlist

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


def archive(request):
    listing = Item.objects.get(title=request.POST["title"])
    return render(request, "auctions/arhcive.html", {
        "listing": listing
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
            item.winner = user_with_highest_bid
            item.is_active = False
            item.save()
        item_sold = f"You sold {item.title} for ${highest_bid}"
        print(f"close listing {item.title} is {user_with_highest_bid}")
    return render(request, "auctions/close-listing.html", {
        "item_sold": item_sold
    })


def category(request, category):
    if category == "Non category":
        listings = Item.objects.filter(category="")
        return render(request, "auctions/category.html", {
        "category": category,
        "listings": listings
        })
    listings = Item.objects.filter(category=category)
    return render(request, "auctions/category.html", {
        "category": category,
        "listings": listings
    })

def categories(request):
    listings = Item.objects.all()
    categories = []
    categories.append("Non category")
    for listing in listings:
        if listing.category == "":
            print("empty")
        elif listing.category not in categories:
            categories.append(listing.category)
    return render(request, "auctions/categories.html", {
        "categories": categories
    })


@login_required
def create(request):
    if request.method == "POST":
        f = ItemForm(request.POST)
        if f.is_valid():
            # Create item
            item = Item()
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
    comments = Comment.objects.filter(item=listing.id)

    # Check if listing is active
    if not listing.is_active and f"{listing.winner}" == f"{request.user}":
        print(f"Listing sold to {listing.winner}")
        messages.error(request, "Congratulations! You bought this item")
        return render(request, "auctions/listing.html", {
            "comments": comments,
            "listing": listing,
        })
    elif not listing.is_active:
        print("Listing no longer active")
        messages.error(request, "Listing no longer active")
        return render(request, "auctions/listing.html", {
            "comments": comments,
            "listing": listing
        })
    
    # Check if user has this listing in watchlist
    if request.user.is_authenticated:
        if listing.watchlists.filter(user=request.user).exists():
            item_in_watchlist = True

    # If user get with POST
    if request.method == "POST":

        # If post with bet
        if "new_bid" in request.POST:
            print("new bid")
            try:
                new_bid = decimal.Decimal(request.POST["new_bid"])
            except decimal.InvalidOperation:
                
                messages.error(request, "Input your bet")
                return render(request, "auctions/listing.html", {
                    "comments": comments,
                    "listing": listing,
                    "item_in_watchlist": item_in_watchlist
                })
                
            # Check if bid is lower than current bid
            if new_bid <= listing.bid:
                # Return error message
                print(item_in_watchlist)
                messages.error(request, "Your bid is lower than the current highest bid")
                return render(request, "auctions/listing.html", {
                    "comments": comments,
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
                "comments": comments,
                "listing": listing,
                "item_in_watchlist": item_in_watchlist
            })
        # If post with comment
        elif "comment" in request.POST:
            print("new comment")
            comment = request.POST["comment"]
            print(comment)
            new_comment = Comment(comment=comment, item=listing, user=request.user)
            new_comment.save()
            return  render(request, "auctions/listing.html", {
                "comments": comments,
                "listing": listing,
                "item_in_watchlist": item_in_watchlist
            })
    # Render current listing
    return render(request, "auctions/listing.html", {
        "comments": comments,
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
            print(f"remove {item.title} {request.user}")
            item.watchlists.filter(user=request.user).delete()
        # If user has not item in watchlist
        else:
            print("save")
            # Save to watchlist
            print(item)
            watchlist = Watchlist(user=request.user, item=item)
            print(watchlist)
            watchlist.save()
        return HttpResponseRedirect(reverse("watchlist"))
    # Render user watchlist
    user_list = Item.objects.filter(watchlists__user=request.user)
    print(user_list)
    return render(request, "auctions/watchlist.html", {
        "user_list": user_list
    })