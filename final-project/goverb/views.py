import json
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import Avg, Count
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse

from .models import User, Verb, VerbScore

def index(request):
    v = Verb.objects.order_by('?')[:10]
    verbs = []
    for verb in v:
        verbs.append(verb.forms.split(","))
    return render(request, "goverb/index.html", {
        "verbs": verbs
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
            return render(request, "goverb/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "goverb/login.html")


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
            return render(request, "goverb/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "goverb/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "goverb/register.html")


def verbs(request):
    path = request.path
    return render(request, "goverb/verbs.html", {
        "path": path
    })
    

@csrf_exempt
def verbs_update(request):
    # Get new values
    if request.method == "GET":
        type = request.headers.get('Upd-Type')
        v = Verb()
        if type == "regular":
            v = Verb.objects.order_by('?')[:10]
        elif type == "repeat":
            less_scored_verbs = VerbScore.objects.filter(user_id=request.user).annotate(avg_score=Avg('score')).order_by('avg_score')
            # Get the ids of the selected verbs
            verbs_id = [verb.verb_id.id for verb in less_scored_verbs]
            # Get the data for the selected verbs
            verbs_by_repeat = VerbScore.objects.filter(id__in=verbs_id).order_by('repeat')[:20]
            verbs_id_by_repeat = [verb.verb_id.id for verb in verbs_by_repeat]
            v = Verb.objects.filter(id__in=verbs_id_by_repeat).order_by('?')[:10]
        elif type == "explore":
            user_verbs = VerbScore.objects.filter(user_id=request.user)
            # if user have met all verbs
            if user_verbs.count() > 110:
                less_repeated_verbs = user_verbs.annotate(avg_reps=Avg('repeat')).order_by('avg_reps')
                # Get the ids of the selected verbs
                verbs_id = [verb.verb_id.id for verb in less_repeated_verbs]
                print(verbs_id)
                # Get the data for the selected verbs
                verbs_by_repeat = VerbScore.objects.filter(id__in=verbs_id).order_by('repeat')[:20]
                verbs_id_by_repeat = [verb.verb_id.id for verb in verbs_by_repeat]
                v = Verb.objects.filter(id__in=verbs_id_by_repeat).order_by('?')[:10]
            else:
                verbs_id = [verb.verb_id.id for verb in user_verbs]
                v = Verb.objects.exclude(id__in=verbs_id).order_by("?")[:10]
         
        else:
            v = Verb.objects.order_by('?')[:10]
        verbs = []
        for verb in v:
            verbs.append(verb.forms.split(","))
        return JsonResponse( {  
            "data": verbs
        })
    # Update verb score
    if request.method == "PUT":

        data = json.loads(request.body)
        verb = Verb.objects.get(verb=data.get('verb')[0])
        score, created = VerbScore.objects.get_or_create(user_id=request.user, verb_id=verb)
        count =  score.repeat / 20 * 100 - data.get("answer")["hint"] / 0.05 - data.get("answer")["tries"] / 0.03 
        if count < 0:
            count = 0
        score.score = count
        score.increment_repeat()
        score.save()
        return JsonResponse({"message": "Success"})
    
    return JsonResponse({"message": "Wrong request"})