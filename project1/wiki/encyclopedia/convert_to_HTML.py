import re

def convert(f):
    """ Convert input strings with Markdown language elements
    nto HTML tags 
    """
    lines = f.split('\n')
    page = '\n'.join(lines[1:])
    page = replace(page)
    page = link(page)
    page = new_line(page)
    return page

def replace(s):
    # Create list of regular expressoins
    reg = ["[*][*].*?[*][*]", "[#][#][ ].*", "[#][ ].*", "[*][ ].*\n"]
    # For each of expcressions iterate inputed text
    for format in reg:
        # Create list with of elements with current expression
        tags = re.findall(format, s)
        # Iterate trough current list and replace to specififc element
        for tag in tags:
          
            # Prepare replace tag for bold type text
            if format == "[*][*].*?[*][*]":
                repl = f"<b>{tag.strip('**')}</b>"
            # Prepare replace tag to heading2 text
            elif format == "[#][#][ ].*":
                repl = f"<h2>{tag.strip('# ')}</h2>"
            # Prepare replace tag to heading1 text
            elif format == "[#][ ].*":
                repl = f"<h1>{tag.strip('# ')}</h1>"
            # Prepare replace tag for list item tag
            elif format == "[*][ ].*\n":
                tag = tag.strip("* ")
                tag = tag.rstrip()
                repl = f"<li>{tag}</li>" 
            # Replace first found regular expression item to HTML tag
            s = re.sub(format, repl, s, count=1)
    return s


def new_line(s):
    # Split text into list
    lines = s.split('\n')
    br = "<br>"
    listItem = re.compile(f"<li>\w*</li>")
    format = []
    for line in lines:
        format.append(line + br)
    page = "\n".join(format)
    return page


def link(s):
    # Exclude all links to list from text
    links = re.findall("[\[].*?[\]][\(].*?[\)]", s)
    # For each link replace to HTML tag
    for link in links:
        # Store string with link name
        name = re.search("[\[].*?[\]]", link).group().strip('[]')
        # Store string with link
        href = re.search("[\(].*?[\)]", link).group().strip('()')
        # Prepare replace tag
        repl = f"<a href={href}>{name}</a>"
        # Replace first found expressiaon with HTML tag
        s = re.sub("[\[].*?[\]][\(].*?[\)]", repl, s, count=1)
    return s

