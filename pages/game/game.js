// 引入可能的配置文件和工具函数
// const config = require('../../config.js'); // 假设有配置文件
// const util = require('../../utils/util.js'); // 假设有工具函数

// 模拟配置 (实际应从 config.js 或其他地方加载)
const LEVELS = [
    { id: 1, grid: [3, 4], theme: "spring", time_limit: 60 },
    { id: 2, grid: [3, 4], theme: "summer", time_limit: 45 },
    { id: 3, grid: [3, 4], theme: "autumn", time_limit: 60 },
    { id: 4, grid: [3, 4], theme: "winter", time_limit: 60 },
];
const THEME_NAMES = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
const CARD_BACK_IMG = '/assets/images/card_back.png'; // 示例路径
const BACKGROUND_IMG = '/assets/images/background.png'; // 示例路径
const MISMATCH_DELAY = 500; // ms
const SHOW_NAME_DURATION = 1500; // ms
const ACHIEVEMENT_POPUP_DURATION = 3000; // ms

// 模拟成就数据 (实际应使用 wx.getStorageSync 加载)
let achievements = {
    complete_spring: { name: "春之初识", unlocked: false, desc: "完成春季关卡" },
    fast_summer: { name: "夏日疾风", unlocked: false, desc: "在45秒内完成夏季关卡" },
    perfect_autumn: { name: "秋之零误", unlocked: false, desc: "在秋季关卡中没有错误匹配" },
    complete_all: { name: "四季轮回", unlocked: false, desc: "完成所有季节关卡" }
};

Page({
  data: {
    gameState: 'menu', // menu, playing, level_complete, game_over, all_levels_complete
    cards: [],
    gridRows: 0,
    gridCols: 0,
    cardWidth: 0,
    cardHeight: 0,
    cardBackImage: CARD_BACK_IMG,
    backgroundImage: BACKGROUND_IMG, // 背景图路径
    levelCompleteImage: null, // 关卡完成图片路径

    flippedCardsIndices: [], // 存储翻开卡片的索引
    matchedPairs: 0,
    totalPairs: 0,
    attempts: 0,
    mistakesCurrentLevel: 0,

    currentLevelIndex: 0,
    currentLevelId: 0,
    currentLevelThemeName: '',
    levels: LEVELS, // 关卡配置
    nextLevelThemeName: '',

    startTime: 0,
    elapsedTime: 0,
    formattedElapsedTime: '0',
    levelTimeLimit: 0,
    remainingTime: 0,
    timerInterval: null, // 计时器ID

    mismatchTimeout: null, // 错误匹配延迟计时器ID
    showNameTimeout: null, // 显示名称计时器ID
    itemNameToShow: '', // 要显示的节气名称

    // 成就相关
    achievements: achievements, // 将成就数据放入data
    unlockedAchievementsCount: 0,
    totalAchievementsCount: Object.keys(achievements).length,
    achievementToShow: null, // 当前弹窗显示的成就
    showAchievementTimeout: null, // 成就弹窗计时器ID
    newlyUnlockedAchievements: [], // 本关新解锁

    gameOverReason: '', // 游戏结束原因
  },

  // --- 生命周期函数 ---
  onLoad: function (options) {
    // 加载持久化的成就状态
    this.loadAchievements();
    // 初始化菜单显示
    this.updateMenuInfo();
    // 预加载声音 (可选)
    this.preloadSounds();
  },

  onUnload: function() {
    // 页面卸载时清除计时器
    if (this.data.timerInterval) clearInterval(this.data.timerInterval);
    if (this.data.mismatchTimeout) clearTimeout(this.data.mismatchTimeout);
    if (this.data.showNameTimeout) clearTimeout(this.data.showNameTimeout);
    if (this.data.showAchievementTimeout) clearTimeout(this.data.showAchievementTimeout);
    // 停止背景音乐等
    if (this.bgmAudio) this.bgmAudio.stop();
  },

  // --- 声音处理 ---
  preloadSounds: function() {
      this.flipAudio = wx.createInnerAudioContext();
      this.flipAudio.src = '/assets/sounds/flip.wav'; // 示例路径
      this.matchAudio = wx.createInnerAudioContext();
      this.matchAudio.src = '/assets/sounds/match.wav';
      this.winAudio = wx.createInnerAudioContext();
      this.winAudio.src = '/assets/sounds/win.wav';
      this.bgmAudio = wx.createInnerAudioContext();
      this.bgmAudio.src = '/assets/sounds/bgm.wav';
      this.bgmAudio.loop = true; // 设置循环播放
  },

  playSound: function(audioContext) {
      if (audioContext) {
          audioContext.stop(); // 先停止再播放，避免重叠问题
          audioContext.play();
      }
  },

  // --- 游戏流程控制 ---
  updateMenuInfo: function() {
      const unlockedCount = Object.values(this.data.achievements).filter(a => a.unlocked).length;
      this.setData({
          unlockedAchievementsCount: unlockedCount,
          currentLevelThemeName: THEME_NAMES[LEVELS[this.data.currentLevelIndex].theme] || '未知',
      });
      if (this.bgmAudio && this.data.gameState === 'menu') {
          this.bgmAudio.play(); // 菜单界面播放BGM
      }
  },

  startGame: function() {
    this.setupLevel(this.data.currentLevelIndex);
  },

  setupLevel: function(levelIndex) {
    if (levelIndex >= this.data.levels.length) {
      this.checkAchievements(null, true); // 检查最终成就
      this.setData({ gameState: 'all_levels_complete' });
      if (this.bgmAudio) this.bgmAudio.stop(); // 停止BGM
      return;
    }

    const levelData = this.data.levels[levelIndex];
    const [rows, cols] = levelData.grid;
    const theme = levelData.theme;
    const totalCards = rows * cols;
    const totalPairs = totalCards / 2;

    // --- 模拟加载卡牌数据 ---
    // 在实际应用中，你需要根据主题动态获取节气列表和图片路径
    // 这里用占位符模拟
    let availableItems = this.getSolarTermsForTheme(theme); // 你需要实现这个函数
    if (availableItems.length < totalPairs) {
        console.error(`主题 ${theme} 的资源不足，需要 ${totalPairs} 对，但只有 ${availableItems.length} 个节气。`);
        wx.showToast({ title: '关卡资源不足', icon: 'error' });
        this.goToMenu(); // 返回菜单
        return;
    }
    // 打乱并选取所需数量的节气
    availableItems.sort(() => 0.5 - Math.random());
    const selectedItems = availableItems.slice(0, totalPairs);

    let cardData = [];
    selectedItems.forEach((item, index) => {
        // 检查是否有可用的图片列表
        if (!item.images || item.images.length === 0) {
            console.error(`节气 ${item.name} (${item.pinyin}) 没有配置可用的图片列表。`);
            // 可以选择跳过这个节气或显示一个默认图片
            return; // 暂时跳过这个节气对
        }
        // 从可用图片列表中随机选择一张
        const availableImages = item.images;
        const randomImageName = availableImages[Math.floor(Math.random() * availableImages.length)];
        // 构建图片路径
        const imagePath = `/assets/images/${theme}/${item.pinyin}/${randomImageName}`; // 使用随机选择的图片名
        const cardInfo = { id: index, name: item.name, pinyin: item.pinyin, imagePath: imagePath };
        cardData.push(cardInfo, { ...cardInfo }); // 添加两次以配对
    });

    // 检查是否有足够的卡牌数据生成
    if (cardData.length !== totalCards) {
        console.error(`未能为关卡 ${levelIndex} 生成足够的卡牌数据。预期 ${totalCards} 张，实际 ${cardData.length} 张。可能是因为部分节气缺少图片配置。`);
        wx.showToast({ title: '关卡资源错误', icon: 'error' });
        this.goToMenu();
        return;
    }

    // 洗牌
    cardData.sort(() => 0.5 - Math.random());

    const cards = cardData.map((data, index) => ({
      id: `${levelIndex}-${index}`, // 唯一ID
      itemId: data.id, // 用于匹配的ID
      itemName: data.name,
      imagePath: data.imagePath,
      isFaceUp: false,
      isMatched: false,
    }));

    // --- 计算卡片布局 ---
    // 这里简化处理，实际应根据屏幕宽度和边距计算
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const padding = 5; // 卡片间距 (px)
    const totalPaddingWidth = (cols + 1) * padding;
    const cardWidth = Math.floor((screenWidth - totalPaddingWidth) / cols);
    const cardHeight = cardWidth; // 假设卡片是正方形

    // --- 重置状态 ---
    if (this.data.timerInterval) clearInterval(this.data.timerInterval); // 清除上一关的计时器

    this.setData({
      gameState: 'playing',
      currentLevelIndex: levelIndex,
      currentLevelId: levelData.id,
      currentLevelThemeName: THEME_NAMES[theme] || theme,
      gridRows: rows,
      gridCols: cols,
      cards: cards,
      cardWidth: cardWidth,
      cardHeight: cardHeight,
      flippedCardsIndices: [],
      matchedPairs: 0,
      totalPairs: totalPairs,
      attempts: 0,
      mistakesCurrentLevel: 0,
      elapsedTime: 0,
      formattedElapsedTime: '0',
      levelTimeLimit: levelData.time_limit || 0,
      remainingTime: levelData.time_limit || 0,
      startTime: Date.now(),
      itemNameToShow: '',
      achievementToShow: null, // 清除上一关可能显示的成就弹窗
      newlyUnlockedAchievements: [], // 清空本关新解锁列表
      levelCompleteImage: `/assets/images/${theme}_complete.png`, // 尝试加载关卡完成图片
    });

    // 启动计时器
    this.startTimer();
    if (this.bgmAudio) this.bgmAudio.play(); // 游戏时播放BGM
  },

  // --- 模拟获取节气数据 ---
  getSolarTermsForTheme: function(theme) {
      // **重要:** 这里是实际的节气数据源
      // 你可以根据需要从其他地方加载，例如 JSON 文件或 API
      // 使用已有的模拟数据作为数据源 - 添加 pinyin 字段
      // !! 将 'image' 改为 'images' 数组，并填入实际的文件名 !!
      const solarTermsData = {
          spring: [
              {name: '立春', pinyin: 'lichun', images: ['lichun1.png', 'lichun2.png', 'lichun3.png', 'lichun4.png']},
              {name: '雨水', pinyin: 'yushui', images: ['yushui1.png', 'yushui2.png', 'yushui3.png', 'yushui4.png']},
              {name: '惊蛰', pinyin: 'jingzhe', images: ['jingzhe1.png', 'jingzhe2.png', 'jingzhe3.png', 'jingzhe4.png']},
              {name: '春分', pinyin: 'chunfen', images: ['chunfen1.png', 'chunfen2.png', 'chunfen3.png', 'chunfen4.png']},
              {name: '清明', pinyin: 'qingming', images: ['qingming1.png', 'qingming2.png', 'qingming3.png']},
              {name: '谷雨', pinyin: 'guyu', images: ['guyu1.png', 'guyu2.png', 'guyu3.png', 'guyu4.png']}
          ],
          summer: [
              {name: '立夏', pinyin: 'lixia', images: ['lixia1.png', 'lixia2.png', 'lixia3.png', 'lixia4.png']},
              {name: '小满', pinyin: 'xiaoman', images: ['xiaoman1.png', 'xiaoman2.png', 'xiaoman3.png', 'xiaoman4.png']},
              {name: '芒种', pinyin: 'mangzhong', images: ['mangzhong1.png', 'mangzhong2.png', 'mangzhong3.png', 'mangzhong4.png']},
              {name: '夏至', pinyin: 'xiazhi', images: ['xiazhi1.png', 'xiazhi2.png', 'xiazhi3.png', 'xiazhi4.png']},
              {name: '小暑', pinyin: 'xiaoshu', images: ['xiaoshu1.png', 'xiaoshu2.png', 'xiaoshu3.png', 'xiaoshu4.png']},
              {name: '大暑', pinyin: 'dashu', images: ['dashu1.png', 'dashu2.png', 'dashu3.png', 'dashu4.png']}
          ],
          autumn: [
              {name: '立秋', pinyin: 'liqiu', images: ['liqiu1.png', 'liqiu2.png', 'liqiu3.png', 'liqiu4.png']},
              {name: '处暑', pinyin: 'chushu', images: ['chushu1.png', 'chushu2.png', 'chushu3.png', 'chushu4.png']},
              {name: '白露', pinyin: 'bailu', images: ['bailu1.png', 'bailu2.png', 'bailu3.png', 'bailu4.png']},
              {name: '秋分', pinyin: 'qiufen', images: ['qiufen1.png', 'qiufen2.png', 'qiufen3.png', 'qiufen4.png']},
              {name: '寒露', pinyin: 'hanlu', images: ['hanlu1.png', 'hanlu2.png', 'hanlu3.png', 'hanlu4.png']},
              {name: '霜降', pinyin: 'shuangjiang', images: ['shuangjiang1.png', 'shuangjiang2.png', 'shuangjiang3.png', 'shuangjiang4.png']}
          ],
          winter: [
              {name: '立冬', pinyin: 'lidong', images: ['lidong1.png', 'lidong2.png', 'lidong3.png', 'lidong4.png']},
              {name: '小雪', pinyin: 'xiaoxue', images: ['xiaoxue1.png', 'xiaoxue2.png', 'xiaoxue3.png', 'xiaoxue4.png']},
              {name: '大雪', pinyin: 'daxue', images: ['daxue1.png', 'daxue2.png', 'daxue3.png', 'daxue4.png']},
              {name: '冬至', pinyin: 'dongzhi', images: ['dongzhi1.png', 'dongzhi2.png', 'dongzhi3.png', 'dongzhi4.png']},
              {name: '小寒', pinyin: 'xiaohan', images: ['xiaohan1.png', 'xiaohan2.png', 'xiaohan3.png', 'xiaohan4.png']},
              {name: '大寒', pinyin: 'dahan', images: ['dahan1.png', 'dahan2.png', 'dahan3.png', 'dahan4.png']}
          ],
      };
      // 返回对应主题的数据，如果找不到则返回空数组
      return solarTermsData[theme] || [];
  },

  // --- 计时器 ---
  startTimer: function() {
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsedTime = Math.floor((now - this.data.startTime) / 1000);
      const remainingTime = this.data.levelTimeLimit > 0
                            ? Math.max(0, this.data.levelTimeLimit - elapsedTime)
                            : 0;

      this.setData({
        elapsedTime: elapsedTime,
        formattedElapsedTime: elapsedTime.toString(),
        remainingTime: remainingTime,
      });

      // 检查时间限制
      if (this.data.levelTimeLimit > 0 && elapsedTime >= this.data.levelTimeLimit) {
        clearInterval(this.data.timerInterval);
        this.setData({
            gameState: 'game_over',
            gameOverReason: '时间到!',
            timerInterval: null
        });
        if (this.bgmAudio) this.bgmAudio.stop();
      }
    }, 1000);
    this.setData({ timerInterval: timerInterval });
  },

  // --- 卡片交互 ---
  handleCardTap: function(event) {
    if (this.data.gameState !== 'playing' || this.data.mismatchTimeout) {
      return; // 游戏非进行中或正在等待翻回时不允许点击
    }

    const index = event.currentTarget.dataset.index;
    const tappedCard = this.data.cards[index];

    // 不能点击已翻开或已匹配的卡片
    if (tappedCard.isFaceUp || tappedCard.isMatched) {
      return;
    }

    // 最多只能翻开两张
    if (this.data.flippedCardsIndices.length >= 2) {
      return;
    }

    this.playSound(this.flipAudio); // 播放翻牌音效

    // 更新卡片状态为翻开
    const cardKey = `cards[${index}].isFaceUp`;
    this.setData({
      [cardKey]: true,
      flippedCardsIndices: [...this.data.flippedCardsIndices, index]
    });

    // 如果翻开了第二张，检查匹配
    if (this.data.flippedCardsIndices.length === 2) {
      this.setData({ attempts: this.data.attempts + 1 }); // 增加尝试次数
      this.checkMatch();
    }
  },

  checkMatch: function() {
    const [index1, index2] = this.data.flippedCardsIndices;
    const card1 = this.data.cards[index1];
    const card2 = this.data.cards[index2];

    if (card1.itemId === card2.itemId) { // 匹配成功
      this.playSound(this.matchAudio); // 播放匹配音效
      const matchedPairs = this.data.matchedPairs + 1;
      const card1Key = `cards[${index1}].isMatched`;
      const card2Key = `cards[${index2}].isMatched`;

      // 显示节气名称
      const itemNameToShow = card1.itemName;
      if (this.data.showNameTimeout) clearTimeout(this.data.showNameTimeout); // 清除上一个显示计时器
      const showNameTimeout = setTimeout(() => {
          this.setData({ itemNameToShow: '' });
      }, SHOW_NAME_DURATION);

      this.setData({
        [card1Key]: true,
        [card2Key]: true,
        matchedPairs: matchedPairs,
        flippedCardsIndices: [], // 清空已翻开列表
        itemNameToShow: itemNameToShow,
        showNameTimeout: showNameTimeout,
      });

      // 检查是否完成关卡
      if (matchedPairs === this.data.totalPairs) {
        this.levelComplete();
      }
    } else { // 匹配失败
      this.setData({ mistakesCurrentLevel: this.data.mistakesCurrentLevel + 1 });
      // 延迟后翻回
      const mismatchTimeout = setTimeout(() => {
        const card1Key = `cards[${index1}].isFaceUp`;
        const card2Key = `cards[${index2}].isFaceUp`;
        this.setData({
          [card1Key]: false,
          [card2Key]: false,
          flippedCardsIndices: [],
          mismatchTimeout: null, // 清除计时器ID
        });
      }, MISMATCH_DELAY);
      this.setData({ mismatchTimeout: mismatchTimeout });
    }
  },

  // --- 关卡与游戏结束处理 ---
  levelComplete: function() {
    if (this.data.timerInterval) clearInterval(this.data.timerInterval); // 停止计时器
    this.playSound(this.winAudio); // 播放胜利音效
    if (this.bgmAudio) this.bgmAudio.pause(); // 暂停BGM

    // 检查并记录本关解锁的成就
    this.checkAchievements(true);

    // 准备下一关信息（如果存在）
    let nextLevelThemeName = '';
    if (this.data.currentLevelIndex + 1 < this.data.levels.length) {
        nextLevelThemeName = THEME_NAMES[this.data.levels[this.data.currentLevelIndex + 1].theme] || '未知';
    }

    this.setData({
      gameState: 'level_complete',
      timerInterval: null,
      nextLevelThemeName: nextLevelThemeName,
    });

    // 如果有新解锁的成就，显示弹窗
    if (this.data.newlyUnlockedAchievements.length > 0) {
        // 优先显示第一个新解锁的
        this.showAchievementPopup(this.data.newlyUnlockedAchievements[0]);
    }
  },

  nextLevel: function() {
    if (this.data.currentLevelIndex + 1 < this.data.levels.length) {
        this.setupLevel(this.data.currentLevelIndex + 1);
    } else {
        // 所有关卡完成
        this.checkAchievements(null, true); // 确保最终成就被检查
        this.setData({ gameState: 'all_levels_complete' });
    }
  },

  goToMenu: function() {
    if (this.data.timerInterval) clearInterval(this.data.timerInterval);
    this.setData({
        gameState: 'menu',
        currentLevelIndex: 0, // 重置到第一关
        timerInterval: null,
        // 可以考虑重置其他需要清空的状态
    });
    this.updateMenuInfo(); // 更新菜单显示信息
  },

  // --- 成就系统 ---
  loadAchievements: function() {
      try {
          const storedAchievements = wx.getStorageSync('game_achievements');
          if (storedAchievements) {
              // 合并，以防代码中有新增成就
              let currentAchievements = this.data.achievements;
              for (const key in currentAchievements) {
                  if (storedAchievements[key] !== undefined) {
                      currentAchievements[key].unlocked = storedAchievements[key].unlocked;
                  }
              }
              this.setData({ achievements: currentAchievements });
              console.log("已加载成就:", currentAchievements);
          } else {
               console.log("未找到已存储的成就，使用默认值。");
               // 如果需要，可以在这里初始化存储
               // wx.setStorageSync('game_achievements', this.data.achievements);
          }
      } catch (e) {
          console.error("加载成就失败:", e);
      }
      this.updateMenuInfo(); // 更新菜单中的成就计数
  },

  saveAchievements: function() {
      try {
          wx.setStorageSync('game_achievements', this.data.achievements);
          console.log("成就已保存");
      } catch (e) {
          console.error("保存成就失败:", e);
      }
  },

  checkAchievements: function(levelWon = false, allLevelsCompleted = false) {
      let currentAchievements = this.data.achievements;
      let newlyUnlocked = [];
      let changed = false;

      if (levelWon) {
          const levelData = this.data.levels[this.data.currentLevelIndex];
          const theme = levelData.theme;

          // 春之初识
          if (theme === "spring" && !currentAchievements.complete_spring.unlocked) {
              currentAchievements.complete_spring.unlocked = true;
              newlyUnlocked.push(currentAchievements.complete_spring);
              changed = true;
          }
          // 夏日疾风
          if (theme === "summer" && this.data.elapsedTime <= 45 && !currentAchievements.fast_summer.unlocked) {
              currentAchievements.fast_summer.unlocked = true;
              newlyUnlocked.push(currentAchievements.fast_summer);
              changed = true;
          }
          // 秋之零误
          if (theme === "autumn" && this.data.mistakesCurrentLevel === 0 && !currentAchievements.perfect_autumn.unlocked) {
              currentAchievements.perfect_autumn.unlocked = true;
              newlyUnlocked.push(currentAchievements.perfect_autumn);
              changed = true;
          }
      }

      // 四季轮回
      if (allLevelsCompleted && !currentAchievements.complete_all.unlocked) {
          currentAchievements.complete_all.unlocked = true;
          // 四季轮回通常在最终结算页面显示，不一定需要弹窗，但可以加入列表
          newlyUnlocked.push(currentAchievements.complete_all);
          changed = true;
          console.log("成就解锁: 四季轮回");
      }

      if (changed) {
          this.setData({
              achievements: currentAchievements,
              newlyUnlockedAchievements: newlyUnlocked // 存储本关新解锁的，用于完成界面显示
          });
          this.saveAchievements(); // 保存更新后的成就状态
          this.updateMenuInfo(); // 更新菜单成就计数
          console.log("新解锁成就:", newlyUnlocked);
      }
  },

  showAchievementPopup: function(achievement) {
      if (this.data.showAchievementTimeout) {
          clearTimeout(this.data.showAchievementTimeout); // 清除上一个弹窗计时器
      }
      const timeoutId = setTimeout(() => {
          this.setData({ achievementToShow: null, showAchievementTimeout: null });
      }, ACHIEVEMENT_POPUP_DURATION);

      this.setData({
          achievementToShow: achievement,
          showAchievementTimeout: timeoutId
      });
      console.log(`显示成就弹窗: ${achievement.name}`);
  },

});