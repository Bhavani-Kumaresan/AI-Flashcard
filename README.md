# AI Concepts Flashcards

Simple HTML/CSS/JS flashcard app that loads questions and answers from a CSV file.

Usage

- Open [index.html](index.html) in a browser.
- The app loads the bundled `cards.csv` by default. Uploading custom CSVs is not available in this version.

Controls

- Click the card to flip and reveal the definition.
- Use `Prev` / `Next` to navigate cards.
- Use `Shuffle` to randomize the deck.

Palette

- The app loads `palette.json` (if present) and shows swatches under the Palette section.
- Choose `Apply to` target (Card or Background) and click a swatch to apply it.
- Selections are saved in `localStorage` so your chosen theme persists in the browser.

Note

- Custom CSV upload and admin controls were removed. The app uses the bundled `cards.csv`.
