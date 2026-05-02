export const DEFAULT_PANTRY = {
  "Spices & Seasonings": [
    { name: "salt", have: true },
    { name: "black pepper", have: true },
    { name: "cumin", have: true },
    { name: "chili powder", have: true },
    { name: "garlic powder", have: true },
    { name: "onion powder", have: true },
    { name: "paprika", have: true },
    { name: "smoked paprika", have: true },
    { name: "oregano", have: true },
    { name: "thyme", have: true },
    { name: "red pepper flakes", have: true },
    { name: "bay leaves", have: true },
    { name: "cinnamon", have: true },
    { name: "cayenne pepper", have: true },
    { name: "italian seasoning", have: true },
    { name: "taco seasoning", have: true },
  ],
  "Aromatics & Fresh": [
    { name: "garlic", have: true },
    { name: "yellow onion", have: true },
    { name: "lemon", have: false },
    { name: "lime", have: false },
    { name: "celery", have: false },
    { name: "carrot", have: false },
    { name: "fresh ginger", have: false },
  ],
  "Oils, Fats & Vinegars": [
    { name: "olive oil", have: true },
    { name: "vegetable oil", have: true },
    { name: "butter", have: true },
    { name: "apple cider vinegar", have: true },
    { name: "white vinegar", have: true },
    { name: "sesame oil", have: true },
  ],
  "Stocks & Broths": [
    { name: "chicken broth", have: true },
    { name: "beef broth", have: true },
    { name: "better than bouillon", have: true },
    { name: "vegetable broth", have: false },
  ],
  "Dairy & Refrigerated": [
    { name: "cream cheese", have: true },
    { name: "sour cream", have: true },
    { name: "parmesan", have: false },
    { name: "cheddar", have: false },
    { name: "heavy cream", have: false },
    { name: "half and half", have: false },
    { name: "milk", have: true },
    { name: "eggs", have: true },
    { name: "goat cheese", have: false },
    { name: "mozzarella", have: false },
    { name: "american cheese", have: false },
  ],
  "Canned & Jarred": [
    { name: "diced tomatoes", have: false },
    { name: "tomato sauce", have: false },
    { name: "tomato paste", have: true },
    { name: "black beans", have: false },
    { name: "chickpeas", have: false },
    { name: "cannellini beans", have: false },
    { name: "sun-dried tomatoes", have: false },
    { name: "artichoke hearts", have: false },
    { name: "chipotle in adobo", have: true },
    { name: "chicken gravy", have: false },
    { name: "coconut milk", have: false },
  ],
  "Dry Goods & Pasta": [
    { name: "flour", have: true },
    { name: "cornstarch", have: true },
    { name: "long grain white rice", have: true },
    { name: "orzo", have: false },
    { name: "egg noodles", have: false },
    { name: "pasta", have: false },
    { name: "breadcrumbs", have: false },
    { name: "panko", have: false },
    { name: "grits", have: false },
    { name: "instant mashed potatoes", have: false },
  ],
  "Condiments & Sauces": [
    { name: "dijon mustard", have: true },
    { name: "worcestershire sauce", have: true },
    { name: "hot sauce", have: true },
    { name: "valentina hot sauce", have: true },
    { name: "soy sauce", have: true },
    { name: "mayonnaise", have: true },
    { name: "pickle juice", have: true },
    { name: "honey", have: true },
    { name: "balsamic vinegar", have: false },
    { name: "fish sauce", have: false },
    { name: "bbq sauce", have: false },
    { name: "marsala wine", have: false },
    { name: "sherry vinegar", have: false },
  ],
  "Nuts, Seeds & Dried Fruit": [
    { name: "almonds", have: false },
    { name: "pecans", have: false },
    { name: "walnuts", have: false },
    { name: "cashews", have: false },
    { name: "pine nuts", have: false },
    { name: "medjool dates", have: false },
    { name: "sesame seeds", have: false },
  ],
  "Baking": [
    { name: "sugar", have: true },
    { name: "brown sugar", have: true },
    { name: "baking powder", have: true },
    { name: "baking soda", have: true },
    { name: "vanilla extract", have: true },
    { name: "cocoa powder", have: false },
  ],
  "Frozen Staples": [
    { name: "frozen corn", have: true },
    { name: "frozen peas", have: true },
    { name: "tater tots", have: false },
    { name: "frozen shrimp", have: false },
    { name: "frozen artichoke hearts", have: false },
    { name: "frozen chicken tenders", have: false },
    { name: "microwave white rice", have: true },
  ],
};

// Fuzzy matching — checks if ingredient text contains pantry item keywords
export function ingredientInPantry(ingredientText, pantryGroups) {
  const ing = ingredientText.toLowerCase();
  for (const items of Object.values(pantryGroups)) {
    for (const item of items) {
      if (!item.have) continue;
      const keyword = item.name.toLowerCase();
      const words = keyword.split(" ");
      if (words.length > 1 && words.every(w => ing.includes(w))) return true;
      if (keyword.length > 3 && ing.includes(keyword)) return true;
    }
  }
  return false;
}
