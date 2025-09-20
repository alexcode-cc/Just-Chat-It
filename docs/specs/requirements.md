# 需求文件

## 介紹

這是一個基於 Electron + Vue3 + Vuetify 的桌面應用程式，旨在提供多AI聊天平台功能。用戶可以同時與多個AI服務（ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot）進行對話，每個聊天視窗都有獨立的會話管理、離線存取功能，並包含提示詞管理和額度追蹤系統。

## 需求

### 需求 1 - 多視窗聊天系統

**用戶故事：** 作為用戶，我希望能夠開啟多個獨立的聊天視窗，這樣我就可以同時與不同的AI服務進行對話。

#### 驗收標準

1. WHEN 用戶點擊新增聊天視窗 THEN 系統 SHALL 開啟一個新的獨立Electron視窗
2. WHEN 用戶選擇AI服務 THEN 系統 SHALL 在該視窗中載入對應的AI聊天介面
3. WHEN 用戶關閉聊天視窗 THEN 系統 SHALL 保存該視窗的會話狀態
4. WHEN 用戶重新開啟應用程式 THEN 系統 SHALL 恢復之前開啟的聊天視窗

### 需求 2 - AI服務整合

**用戶故事：** 作為用戶，我希望能夠連接到多個AI服務，這樣我就可以根據需要選擇最適合的AI進行對話。

#### 驗收標準

1. WHEN 用戶選擇AI服務 THEN 系統 SHALL 支援 ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot
2. WHEN 用戶選擇AI服務 THEN 系統 SHALL 在聊天視窗中載入對應AI的Web Chat網址
3. WHEN 用戶與AI互動 THEN 系統 SHALL 透過嵌入的WebView顯示AI的網頁聊天介面
4. IF 網頁載入失敗 THEN 系統 SHALL 顯示錯誤訊息並提供重新載入選項

### 需求 3 - 獨立會話管理

**用戶故事：** 作為用戶，我希望每個聊天視窗都有獨立的會話狀態，這樣我就可以在不同視窗中進行不同主題的對話。

#### 驗收標準

1. WHEN 用戶在視窗A發送訊息 THEN 系統 SHALL 僅在視窗A中顯示對話記錄
2. WHEN 用戶在視窗B發送訊息 THEN 系統 SHALL 不影響視窗A的對話狀態
3. WHEN 用戶關閉視窗 THEN 系統 SHALL 保存該視窗的完整對話記錄
4. WHEN 用戶重新開啟相同AI的視窗 THEN 系統 SHALL 載入之前的對話記錄

### 需求 4 - 離線存取功能

**用戶故事：** 作為用戶，我希望能夠在離線狀態下查看之前的對話記錄，這樣我就可以隨時回顧重要的對話內容。

#### 驗收標準

1. WHEN 用戶與AI進行對話 THEN 系統 SHALL 監控WebView中的對話內容並存儲到本地資料庫
2. WHEN 網路連接中斷 THEN 系統 SHALL 允許用戶查看已存儲的對話記錄
3. WHEN 用戶搜尋對話記錄 THEN 系統 SHALL 在本地資料庫中執行搜尋
4. WHEN 用戶開啟歷史對話 THEN 系統 SHALL 顯示該AI的完整對話記錄

### 需求 5 - 額度追蹤與提醒

**用戶故事：** 作為用戶，我希望系統能夠追蹤各AI服務的使用額度，這樣我就可以知道何時額度用完以及何時可以重新使用。

#### 驗收標準

1. WHEN 用戶手動標記AI額度用完 THEN 系統 SHALL 記錄該AI的額度重置時間
2. WHEN AI額度用完 THEN 系統 SHALL 在該AI的聊天視窗中顯示額度用完提示並禁用該視窗
3. WHEN 額度重置時間到達 THEN 系統 SHALL 發送桌面通知提醒用戶
4. WHEN 用戶查看AI狀態 THEN 系統 SHALL 顯示各AI的可用狀態和重置時間

### 需求 6 - 提示詞管理系統

**用戶故事：** 作為用戶，我希望能夠保存和管理常用的提示詞，這樣我就可以重複使用有效的提示詞。

#### 驗收標準

1. WHEN 用戶發送提示詞 THEN 系統 SHALL 自動記錄該提示詞到歷史記錄
2. WHEN 用戶標記提示詞為收藏 THEN 系統 SHALL 將提示詞加入提示詞倉庫
3. WHEN 用戶開啟提示詞倉庫 THEN 系統 SHALL 顯示所有已收藏的提示詞
4. WHEN 用戶選擇提示詞 THEN 系統 SHALL 將提示詞填入當前聊天輸入框

### 需求 7 - 多AI同時查詢功能

**用戶故事：** 作為用戶，我希望能夠將同一個提示詞同時發送給多個AI，這樣我就可以比較不同AI的回應結果。

#### 驗收標準

1. WHEN 用戶選擇多AI查詢模式 THEN 系統 SHALL 開啟比較視窗並載入多個AI的WebView
2. WHEN 用戶輸入提示詞 THEN 系統 SHALL 提供一鍵發送到所有可用AI的功能
3. WHEN 用戶點擊發送 THEN 系統 SHALL 在各個AI的WebView中自動填入相同提示詞
4. IF 某個AI額度用完或無法使用 THEN 系統 SHALL 在該AI的區域顯示不可用狀態

### 需求 8 - Liquid Glass 液態玻璃視窗設計

**用戶故事：** 作為用戶，我希望有一個採用iOS 26 Liquid Glass設計的現代化視窗，這樣我就能享受半透明果凍質感的沉浸式體驗。

#### 驗收標準

1. WHEN 用戶查看任何視窗 THEN 系統 SHALL 採用液態玻璃材質呈現半透明、果凍般的質感
2. WHEN 視窗顯示內容 THEN 系統 SHALL 根據螢幕內容與周圍環境動態改變顏色與亮度
3. WHEN 用戶操作介面 THEN 系統 SHALL 即時反應操作並呈現光影的動態反射效果
4. WHEN 用戶捲動內容 THEN 系統 SHALL 在介面捲動時呈現流暢的光影動態反射
5. WHEN 用戶查看視窗 THEN 系統 SHALL 將視窗四個角落設計成圓角並具備折射光線效果
6. WHEN 用戶開啟系統設定 THEN 系統 SHALL 提供液態玻璃效果強度和透明度的調整選項
7. WHEN 用戶調整背景設定 THEN 系統 SHALL 根據背景圖像產生不同的光影折射效果

### 需求 9 - Liquid Glass 介面元件設計

**用戶故事：** 作為用戶，我希望所有介面元件都採用液態玻璃設計語言，這樣我就能享受一致且沉浸的視覺體驗。

#### 驗收標準

1. WHEN 用戶查看按鈕、開關、滑桿 THEN 系統 SHALL 採用能反射、折射光線的動態渲染技術
2. WHEN 用戶操作通知中心與控制中心 THEN 系統 SHALL 呈現液態玻璃材質效果
3. WHEN 用戶查看分頁列、工具列與側邊欄 THEN 系統 SHALL 隨著情境動態變化視覺效果
4. WHEN 用戶與介面元件互動 THEN 系統 SHALL 提供即時的液態玻璃反應效果
5. WHEN 用戶切換主題 THEN 系統 SHALL 在深色和淺色模式下保持液態玻璃效果一致性
6. WHEN 用戶查看文字內容 THEN 系統 SHALL 確保在液態玻璃背景下文字清晰易讀
7. WHEN 用戶移動滑鼠或觸控 THEN 系統 SHALL 讓液態玻璃材質對移動產生即時反應

### 需求 10 - 系統托盤與熱鍵功能

**用戶故事：** 作為用戶，我希望程式能夠縮小到系統托盤並透過熱鍵快速啟動特定AI，這樣我就可以隨時快速存取AI服務。

#### 驗收標準

1. WHEN 用戶關閉主視窗 THEN 系統 SHALL 自動縮小到工作列系統托盤
2. WHEN 用戶按下全域熱鍵 THEN 系統 SHALL 快速顯示主控制面板
3. WHEN 用戶按下特定AI熱鍵 THEN 系統 SHALL 直接開啟對應AI的聊天視窗
4. WHEN 系統支援的AI服務 THEN 系統 SHALL 為每個AI（ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot）分配獨立的熱鍵
5. WHEN 用戶右鍵點擊托盤圖標 THEN 系統 SHALL 顯示快速選單包含各AI選項和設定
6. WHEN 用戶設定熱鍵 THEN 系統 SHALL 允許自訂各AI的啟動熱鍵組合

### 需求 11 - 剪貼簿智能整合

**用戶故事：** 作為用戶，我希望系統能夠智能檢測剪貼簿內容並自動開始對話，這樣我就可以快速處理複製的文字內容。

#### 驗收標準

1. WHEN 用戶透過熱鍵啟動AI視窗 THEN 系統 SHALL 自動檢查剪貼簿內容
2. IF 剪貼簿有文字內容 AND 剪貼簿檢查功能已啟用 THEN 系統 SHALL 將內容填入新的聊天視窗
3. WHEN 剪貼簿內容被填入 THEN 系統 SHALL 自動聚焦到輸入框並準備發送
4. WHEN 用戶開啟系統設定 THEN 系統 SHALL 提供剪貼簿檢查功能的開關選項
5. WHEN 系統首次安裝 THEN 剪貼簿檢查功能 SHALL 預設為啟用狀態
6. IF 剪貼簿內容為空或非文字 THEN 系統 SHALL 正常開啟空白聊天視窗

### 需求 12 - 用戶介面與體驗

**用戶故事：** 作為用戶，我希望有一個直觀易用的介面，這樣我就可以輕鬆管理多個聊天視窗和功能。

#### 驗收標準

1. WHEN 用戶開啟應用程式 THEN 系統 SHALL 顯示具有現代化設計感的主控制面板
2. WHEN 用戶操作介面 THEN 系統 SHALL 使用 Vuetify 提供一致的 Material Design 3 風格
3. WHEN 用戶調整視窗大小 THEN 系統 SHALL 保持介面元素的響應式佈局
4. WHEN 用戶執行操作 THEN 系統 SHALL 提供清晰的操作回饋和狀態指示
5. WHEN 用戶開啟設定頁面 THEN 系統 SHALL 提供完整的系統設定選項包含熱鍵和剪貼簿設定