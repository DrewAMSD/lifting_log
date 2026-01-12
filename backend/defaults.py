from models import Exercise

MUSCLES: list[str] = [
        "Chest", 
        "Triceps", 
        "Biceps", 
        "Forearms",
        "Abdominals", 
        "Shoulders",
        "Lats",
        "Lower Back",
        "Upper Back",
        "Quadriceps",
        "Glutes",
        "Hamstrings",
        "Calves",
        "Adductors",
        "Abductors",
        "Neck"
        ]

EXERCISES: list[Exercise] = [
    {
        "name": "Bench Press(Barbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "Lie horizontally on a weight training bench. Begin by holding the barbell over your head. One rep is completed by lowering the bar to your chest and then pressing it back upwards back to its original position.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Bench Press(Dumbbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "Lie horizontally on a weight training bench. Begin by holding dumbbells up with straight arms. One rep is completed by lowering dumbbells besides chest while bending elbows and then pressing it back upwards back to its original position.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Pull Ups",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "Begin by gripping an overhead bar shoulder-width or a little wider and enter into a dead hang. One rep is completed by pulling chin over the bar and returning to initial hang.",
        "weight": False,
        "reps": True,
        "time": False
    }
]