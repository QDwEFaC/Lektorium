"""
Задание: Написать greet

Открой связанную заметку в Obsidian (папка vault/Задания).
Когда закончишь — отметь статус «Сдано» в Лектории.
"""


def greet(name: str) -> str:
    # Напиши решение здесь
    if name == "":
        return "Hi, Mr.Incognito!"
    else:
        return "Hi, " + name
    # raise NotImplementedError


def solve() -> None:
    print(greet("Маша"))


if __name__ == "__main__":
    solve()
