# WeChat Mini Program

This project is a WeChat Mini Program designed for a memory matching game based on the 24 solar terms. The application allows users to engage in a fun and interactive way to learn about these terms while playing a card matching game.

## Project Structure

- **app.js**: The entry file for the mini program, responsible for initializing the lifecycle and global configuration.
- **app.json**: The global configuration file defining the page paths, window appearance, and network timeout settings.
- **app.wxss**: The global style file that defines the overall styling rules for the mini program.
- **pages/**: This directory contains the pages of the mini program.
  - **index/**: The main page of the application. (Note: This seems to be legacy, current main page is 'game')
    - **index.js**: Logic for the main page.
    - **index.json**: Configuration for the main page.
    - **index.wxml**: Structure for the main page.
    - **index.wxss**: Styles for the main page.
  - **logs/**: A page to display logs. (Note: This might be legacy or unused based on app.json)
    - **logs.js**: Logic for the logs page.
    - **logs.json**: Configuration for the logs page.
    - **logs.wxml**: Structure for the logs page.
    - **logs.wxss**: Styles for the logs page.
  - **game/**: The game page.
    - **game.js**: Logic for the game page, including main functionalities and event handling.
    - **game.json**: Configuration for the game page.
    - **game.wxml**: Structure for the game page.
    - **game.wxss**: Styles for the game page.
- **utils/**: This directory contains utility functions.
  - **util.js**: Contains common utility functions that can be used across different pages of the mini program.
- **assets/**: This directory is used to store images and sound resources.
  - **images/**: Contains game-related images.
    - **card_back.png**: Image for the back of the cards.
    - **background.png**: Background image for the game.
    - **spring/**: Contains images related to the spring season.
      - **lichun/lichun.png**: Image for the solar term "Lichun". (Example using pinyin directory)
      - **yushui/yushui.png**: ...
      - **qingming/qingming.png**: ... (Using pinyin 'qingming' as directory name)
      - ...
    - **summer/**: Contains images related to the summer season (e.g., lixia/lixia.png).
    - **autumn/**: Contains images related to the autumn season (e.g., liqiu/liqiu.png).
    - **winter/**: Contains images related to the winter season (e.g., lidong/lidong.png).
    - **spring_complete.png**: Image shown upon completing the spring level.
    - **summer_complete.png**: ...
    - **autumn_complete.png**: ...
    - **winter_complete.png**: ...
  - **sounds/**: Contains sound resources related to the game.
    - **flip.wav**: Sound effect for flipping a card.
    - **match.wav**: Sound effect for a successful match.
    - **win.wav**: Sound effect for winning the game.
    - **bgm.wav**: Background music for the game.
- **project.config.json**: The project configuration file containing basic information and settings for the mini program.
- **project.private.config.json**: Private project configuration file.

## Usage

To run the mini program, you need to have the WeChat Developer Tool installed. Open the tool, create a new project, and import this project directory (`c:\Users\qyx\Desktop\wechat-mini-program`). You can then run the mini program in the simulator. Make sure to provide your AppID or use a test AppID.

## Features

- Interactive memory matching game.
- Learn about the 24 solar terms through gameplay.
- Sound effects and background music enhance the gaming experience.
- Achievement system to track progress.
- Different levels based on seasons with varying time limits.

## License

This project is open-source and available for modification and distribution under the MIT License.