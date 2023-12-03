from encyclopedia.convert_to_HTML import convert
from random import choice
from django import forms
from django.shortcuts import render, redirect
from . import util


class EntryForm(forms.Form):
    title = forms.CharField(label="title")
    content = forms.CharField(label="content")


def create(request):
    # If get page via POST
    if request.method == "POST":
        # Get data from form
        f = EntryForm(request.POST)

        # If form is not empty or has changes
        if f.is_valid():
            title = f.cleaned_data["title"]
            content = f.cleaned_data["content"]
            # Check if page with this title is exist
            entries = []
            for entry in util.list_entries():
                entries.append(entry.lower())
            if title.lower() in entries:
                # Render message with error of existed page
                return render(request, "encyclopedia/error.html", {
                    "exist": title
                })
            else:
                # Add title to content page
                content = f"# {title}\n\n{content}"
                # Save content from textarea to server and render this page
                util.save_entry(title, content)
                return redirect("title", title)
        else:   
            return render(request, "encyclopedia/error.html", {
                "error": None,
                "exist": None,
                "fail": True
            })

    # If get page via GET
    return render(request, "encyclopedia/create.html")

def edit(request):
    # If method POST
    if request.method == "POST":
        # Take raw data from entry file
        # Send to text area form for edit
        f = EntryForm(request.POST)
        if f.is_valid():    
            title = f.cleaned_data["title"]
            # Add title to content page
            content = f"# {title}\n\n{f.cleaned_data['content']}"
            # Save content from textarea to server and render this page
            util.save_entry(title, content)
            return redirect("title", title)
    try:
        title = request.GET["title"]
        # Get page from files on servrer
        page = util.get_entry(title)
        # Split page by lines for prepare to remove title
        page = page.split('\n')
    except:
        return render(request, "encyclopedia/error.html", {
                "error": None,
                "exist": None,
                "fail": True
        })
    content = '\n'.join(page[1:])
    return render(request, "encyclopedia/edit.html", {
        "title": title,
        "content": content
    })


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })


def random(request):
    return redirect("title", choice(util.list_entries()))

def search(request):
    # Get search by POST
    if request.method == "POST":
        print("result")
        # Get search title from form
        result = request.POST["q"]
        # If entry return searching title
        if util.get_entry(result):
            print("search found")
            # Redirect to page title
            return redirect("title", result)
        # If particaly match return list of matched titles
        elif util.search_entry(result):
            return render(request, "encyclopedia/search.html",{
            "result": util.search_entry(result)
        })
        # Else return error with not foumd page
        else:
            return render(request, "encyclopedia/error.html", {
            "error": result
        })
    # If get to page search via GET
    else:
        return render(request, "encyclopedia/search.html",{
            "result": None
        })


def title(request, title):
    page = util.get_entry(title)
    t = page.split("\n")[0].strip("#").lstrip()
    if page:
        # Convert markdown page to HTML
        page = convert(page)
        
        return render(request, "encyclopedia/title.html", {
            "title": t,
            "page": page
        })
    else:
        return render(request, "encyclopedia/error.html", {
            "error": t
        })