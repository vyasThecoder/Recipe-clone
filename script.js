const chooseCategory = document.querySelector("#Choose-category");
const chooseCountry = document.querySelector("#Choose-country");
const cardContainer = document.querySelector("#card-container");
const viewBox = document.querySelector("#view-box");
const suggestionsInputBox = document.querySelector("#suggestions-list");
const searchInput = document.querySelector("#search-input");
const searchBtn = document.querySelector("#search-btn");
const latestCardContainer = document.querySelector("#recently-card-container");

const dishName = document.querySelector("#dish-name");
const dishImage = document.querySelector("#dish-image");
const ingredientsList = document.querySelector("#ingredients-list");
const dishInstructions = document.querySelector("#dish-instructions");
const dishVideo = document.querySelector("#dish-video");
const closeBtn = document.querySelector("#close-btn");

let DATA_CARD = [];
let SUGGESTION_LIST = new Set();
let LATEST_VIEW = [];

// -------------------- HELPERS --------------------
async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

// -------------------- RENDER MAIN CARDS --------------------
function renderDishCard(error) {
  if (error) {
    cardContainer.innerHTML = `<h1 class="text-center uppercase text-xl">${error}</h1>`;
    return;
  }

  if (!DATA_CARD || !DATA_CARD.length) {
    cardContainer.innerHTML = `<h1 class="text-center uppercase text-xl">No recipes found</h1>`;
    return;
  }

  cardContainer.innerHTML = DATA_CARD.map(
    (val) => `
      <div class="bg-white rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] duration-200">
        <img src="${val.strMealThumb}" class="w-full h-52 object-cover" alt="${
      val.strMeal
    }" />
        <div class="p-4">
          <p class="text-sm font-semibold text-black">${
            val.strMeal.length > 28
              ? val.strMeal.slice(0, 25) + "..."
              : val.strMeal
          }</p>
          <div class="flex justify-center items-center mt-3">
            <button onclick="showViewBox('${val.idMeal}')" 
            class="w-[90%] py-1 border border-[#FAA131]  text-black hover:bg-[#FAA131] hover:text-white rounded-lg active:scale-95">View</button>
          </div>
        </div>
      </div>
    `
  ).join("");
}

// -------------------- RENDER LATEST VIEWED CARDS --------------------
function renderLatestDishCard(error) {
  if (LATEST_VIEW.length > 0) {
    document.querySelector("#recently").classList.remove("hidden");
    document.querySelector("#recently").classList.add("block");
  }

  if (error) {
    latestCardContainer.innerHTML = `<h1 class="text-center uppercase text-xl">${error}</h1>`;
    return;
  }

  if (!LATEST_VIEW.length) {
    latestCardContainer.innerHTML = "";
    return;
  }

  latestCardContainer.innerHTML = LATEST_VIEW.map(
    (val) => `
      <div class="bg-white rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] duration-200">
        <img src="${val.strMealThumb}" class="w-full h-52 object-cover" alt="${
      val.strMeal
    }" />
        <div class="p-4">
          <p class="text-sm font-semibold text-black">${
            val.strMeal.length > 28
              ? val.strMeal.slice(0, 25) + "..."
              : val.strMeal
          }</p>
          <div class="flex justify-center items-center mt-3">
            <button onclick="showViewBox('${val.idMeal}')" 
            class="w-[90%] py-1 border border-[#FAA131]  text-black hover:bg-[#FAA131] hover:text-white rounded-lg active:scale-95">View</button>
          </div>
        </div>
      </div>
    `
  ).join("");
}

// -------------------- ADD TO LATEST VIEW FEATURE --------------------
function addLatestViewDish(value) {
  if (!value) return;

  const exists = LATEST_VIEW.some(
    (val) => String(val.idMeal) === String(value.idMeal)
  );

  if (!exists) {
    LATEST_VIEW.unshift(value);
    if (LATEST_VIEW.length > 5) LATEST_VIEW.pop();
  }

  renderLatestDishCard();
}

// -------------------- SEARCH FUNCTIONS --------------------
async function getDishBySearchValue(value) {
  const v = (value || "").trim();
  suggestionsInputBox.classList.add("hidden");
  if (!v) return;

  try {
    // try search by name first
    const byName = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
        v
      )}`
    );
    if (byName && byName.meals) {
      DATA_CARD = byName.meals;
      renderDishCard();
      searchInput.value = "";
      return;
    }

    // fallback: category and area filters
    const [categoryData, countryData] = await Promise.all([
      fetchData(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(
          v
        )}`
      ),
      fetchData(
        `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(
          v
        )}`
      ),
    ]);

    let combined = [];
    if (categoryData && categoryData.meals)
      combined.push(...categoryData.meals);
    if (countryData && countryData.meals) combined.push(...countryData.meals);

    const uniqueMeals = [
      ...new Map(combined.map((item) => [item.idMeal, item])).values(),
    ];
    DATA_CARD = uniqueMeals;

    uniqueMeals.length ? renderDishCard() : renderDishCard(`${v} Not Found`);
  } catch (err) {
    renderDishCard(`${v} Not Found`);
    console.error(err);
  }

  searchInput.value = "";
}

// -------------------- INPUT SEARCH SUGGESTIONS --------------------
function setupSuggestions() {
  searchInput.addEventListener("input", (e) => {
    const value = (e.target.value || "").toLowerCase();

    if (!value.trim()) {
      suggestionsInputBox.classList.add("hidden");
      return;
    }

    const result = [...SUGGESTION_LIST].filter((item) =>
      item.toLowerCase().includes(value)
    );

    if (!result.length) return suggestionsInputBox.classList.add("hidden");

    suggestionsInputBox.innerHTML = result
      .map(
        (val) =>
          `<li class="cursor-pointer p-2 hover:bg-orange-500 hover:text-white" data-val="${val}">${val}</li>`
      )
      .join("");

    // attach click handlers (event delegation)
    suggestionsInputBox.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () =>
        getDishBySearchValue(li.getAttribute("data-val"))
      );
    });

    suggestionsInputBox.classList.remove("hidden");
  });
}

// small helper to trigger suggestion logic from inline/oninput if present
function showSuggestions() {
  searchInput.dispatchEvent(new Event("input"));
}

// -------------------- FETCH OPTIONS --------------------
async function fetchCountryData() {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/list.php?a=list`
    );
    chooseCountry.innerHTML =
      `<option selected disabled>Choose Country</option>` +
      data.meals
        .map(({ strArea }) => {
          SUGGESTION_LIST.add(strArea);
          return `<option value="${strArea}">${strArea}</option>`;
        })
        .join("");
  } catch (err) {
    console.error(err);
  }
}

async function fetchCategoryData() {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/list.php?c=list`
    );
    chooseCategory.innerHTML =
      `<option selected disabled>Choose Category</option>` +
      data.meals
        .map(({ strCategory }) => {
          SUGGESTION_LIST.add(strCategory);
          return `<option value="${strCategory}">${strCategory}</option>`;
        })
        .join("");
  } catch (err) {
    console.error(err);
  }
}

// -------------------- FILTER DROPDOWNS --------------------
chooseCountry.addEventListener("change", async (e) => {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(
        e.target.value
      )}`
    );
    DATA_CARD = data.meals || [];
    renderDishCard();
  } catch (err) {
    console.error(err);
  }
});

chooseCategory.addEventListener("change", async (e) => {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(
        e.target.value
      )}`
    );
    DATA_CARD = data.meals || [];
    renderDishCard();
  } catch (err) {
    console.error(err);
  }
});

// -------------------- DEFAULT DISH --------------------
async function defaultGetDish() {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert`
    );
    DATA_CARD = (data.meals || []).slice(5, 15);
    renderDishCard();
  } catch (err) {
    console.error(err);
    renderDishCard("Failed to load default dishes");
  }
}

// -------------------- VIEW POPUP --------------------
async function getIngredientsById(id) {
  try {
    const data = await fetchData(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(
        id
      )}`
    );
    const meal = data.meals && data.meals[0];
    if (!meal) return;

    addLatestViewDish(meal);

    dishName.textContent = meal.strMeal;
    dishImage.src = meal.strMealThumb;
    dishImage.alt = meal.strMeal;
    dishInstructions.textContent = meal.strInstructions;
    dishVideo.href = meal.strYoutube || "#";

    ingredientsList.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const safeMeasure = measure ? measure.trim() : "";
        ingredientsList.innerHTML += `<li>${ingredient} - ${safeMeasure}</li>`;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function showViewBox(id) {
  viewBox.classList.remove("hidden");
  getIngredientsById(id);
}

function closeButton() {
  viewBox.classList.add("hidden");
}

closeBtn.addEventListener("click", closeButton);

// wire up search button
searchBtn.addEventListener("click", () =>
  getDishBySearchValue(searchInput.value)
);

// -------------------- INIT --------------------
defaultGetDish();
setupSuggestions();
fetchCountryData();
fetchCategoryData();
