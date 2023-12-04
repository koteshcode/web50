
import re

def find_words(str):
    w = []
    list = ["CSS", "Python", "Django", "HTML", "thone"]
    pattern = re.compile(f'\w*?{str}+\w*?')
    for word in list:
        print(word)
        if pattern.search(word.lower()):
            print(word)
            w.append(word)
    return w

def short(s):
    w = ["CSS", "Python", "Django", "HTML", "thone"]
    return list(word for word in w if re.search(
                f'\w*?{s}+\w*?', word.lower()))


s = "hon"
print(short(s))
