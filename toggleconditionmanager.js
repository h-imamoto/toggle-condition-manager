$(function() {

    // グローバル変数
    window.ToggleConditionManager = ToggleConditionManager;

    /**
     * コンストラクタ呼び出しで、指定されたHTMLタグ間の表示・非表示を管理するインスタンスを返却
     */
    function ToggleConditionManager() {
        // コンストラクタ呼び出しを強制
        if (!this instanceof ToggleConditionManager) {
            return new ToggleConditionManager();
        }

        // 公開メソッド
        this.initialize = initialize;
        this.showAllTags = showAllTags;
        this.hideTags = hideTags;
        this.showErrorMessages = showErrorMessages;

        // 状態を持つ変数
        var canToggle = false;
        var toggleTargetElements = {};

        // ラッパータグのjQueryオブジェクト
        var $container = $("#content");

        // エラーメッセージ関連
        var $errorMessageArea = $("#originalScriptErrorMessageArea");
        var errorMessageClass = "errorMessage";

        // 定数
        var BORDER_TAG_SELECTOR = "p.toggleBorder";
        var OPEN_END_DATA_NAME = "data-open-end";
        var OPEN_END_OPEN = "open";
        var OPEN_END_END = "end";
        var HIDE_CONDITION_DATA_NAME = "data-hide-condition";
        var DETAIL_DATA_NAME = "data-detail";

        /**
         * 初期化関数
         * @param initialContainerSelector
         * @param initialErrorMessageAreaSelector
         * @param initialErrorMessageClass
         */
        function initialize(initialContainerSelector, initialErrorMessageAreaSelector, initialErrorMessageClass) {
            var currentToggleBorders = [];
            var $toggleBorderTags = $(BORDER_TAG_SELECTOR, $container);
            var $toggleButton = $("#toggleButton");

            if ($toggleBorderTags.size() === 0) {
                canToggle = true;
                return;
            }

            // initialContainerSelectorの指定が無ければデフォルトのまま
            $container = initialContainerSelector ? $(initialContainerSelector) : $container;

            // initialErrorMessageAreaSelectorの指定が無ければデフォルトのまま
            $errorMessageArea = initialErrorMessageAreaSelector ? $(initialErrorMessageAreaSelector) : $errorMessageArea;

            // initialErrorMessageClassNameの指定が無ければデフォルトのまま
            errorMessageClass = initialErrorMessageClass || errorMessageClass;

            $.each($toggleBorderTags, function () {
                var openEnd = $(this).attr(OPEN_END_DATA_NAME);
                var hideCondition = $(this).attr(HIDE_CONDITION_DATA_NAME);
                var detail = $(this).attr(DETAIL_DATA_NAME);
                var isValidTag;

                switch (openEnd) {
                    case OPEN_END_OPEN:
                        isValidTag = initializeForToggleBorderOpenTag($(this), currentToggleBorders, hideCondition, detail);
                        break;
                    case OPEN_END_END:
                        isValidTag = initializeForToggleBorderEndTag(currentToggleBorders, hideCondition);
                        break;
                    default :
                        isValidTag = false;
                }

                // $.eachはtrueを返すとcontinue, falseを返すとbreakと同じ挙動となる
                return canToggle = isValidTag;
            });

            if (!canToggle) {
                showErrorMessages("開始タグ・終了タグ不整合エラー")
                $toggleButton.attr("disabled", "disabled");
            }
        }

        /**
         * 各非表示領域の開始タグに対する初期化処理
         * @param $current
         * @param toggleBorders
         * @param hideCondition
         * @param detail
         * @returns {boolean}
         */
        function initializeForToggleBorderOpenTag($current, toggleBorders, hideCondition, detail) {
            var $endTag = $current;
            var endTagIgnoreCount = 0;
            var push = Array.prototype.push;
            var slice = Array.prototype.slice;
            var $toggleTargets, nextOpenEnd, nextHideCondition, nextDetail;

            do {
                $endTag = $endTag.nextAll(BORDER_TAG_SELECTOR).first();
                if ($endTag.size() === 0) {
                    return false;
                }
                nextOpenEnd = $endTag.attr(OPEN_END_DATA_NAME);
                nextHideCondition = $endTag.attr(HIDE_CONDITION_DATA_NAME);
                nextDetail = $endTag.attr(DETAIL_DATA_NAME);
                if (nextHideCondition === hideCondition) {
                    switch (nextOpenEnd) {
                        case OPEN_END_OPEN:
                            endTagIgnoreCount++;
                            break;
                        case OPEN_END_END:
                            if (endTagIgnoreCount > 0) {
                                endTagIgnoreCount--;
                            }
                            break;
                        default :
                            return false;
                    }
                }
            } while (nextOpenEnd !== OPEN_END_END || nextHideCondition !== hideCondition || endTagIgnoreCount > 0);

            if (detail !== nextDetail) {
                return false;
            }

            $toggleTargets = $current.nextUntil($endTag);
            toggleTargetElements[hideCondition] = toggleTargetElements[hideCondition] || [];
            push.apply(toggleTargetElements[hideCondition], slice.call($toggleTargets));

            toggleBorders.push(hideCondition);
            return true;
        }

        /**
         * 各非表示領域の終了タグに対する初期化処理
         * @param toggleBorders
         * @param hideCondition
         * @returns {boolean}
         */
        function initializeForToggleBorderEndTag(toggleBorders, hideCondition) {
            var len = toggleBorders.length;
            var i;

            if (len === 0) {
                return false;
            }

            for (i = len - 1; i >= 0; i--) {
                if (toggleBorders[i] === hideCondition) {
                    toggleBorders.splice(i, 1);
                    return true;
                }
            }

            return false;
        }

        /**
         * エラーメッセージを表示
         * @param messages
         */
        function showErrorMessages(messages) {
            var i, len;

            if ($errorMessageArea.size() == 0) {
                alert(messages);
                return;
            }

            // 引数が文字列で来た場合は配列に変更
            if (typeof messages === "string") {
                messages = [messages];
            }

            // 既存のエラーメッセージを削除
            $("." + errorMessageClass, $errorMessageArea).remove();

            // エラーメッセージを追加
            for (i = 0, len = messages.length; i < len; i++) {
                $errorMessageArea.append($("<p>").addClass(errorMessageClass).html(messages[i]));
            }

            // エラーメッセージ表示領域を表示
            $errorMessageArea.show();
        }

        /**
         * 表示・非表示の対象となっているすべてのHTMLタグを再表示する
         */
        function showAllTags() {
            var key, i, len;
            for (key in toggleTargetElements) {
                for (i = 0, len = toggleTargetElements[key].length; i < len; i++) {
                    $(toggleTargetElements[key][i]).show();
                }
            }
            $(BORDER_TAG_SELECTOR).hide();
        }

        /**
         * 非表示にする条件を指定して対象のHTMLタグを非表示にする
         * @param toggleCondition
         */
        function hideTags(toggleCondition) {
            if (!canToggle) return;

            var toggleTargets = toggleTargetElements[toggleCondition];

            if (typeof toggleTargets === "undefined") {
                return;
            }

            var $openTags = $(BORDER_TAG_SELECTOR).filter(function () {
                var openEnd = $(this).attr(OPEN_END_DATA_NAME);
                var hideCondition = $(this).attr(HIDE_CONDITION_DATA_NAME);
                return openEnd === OPEN_END_OPEN && hideCondition === toggleCondition;
            });
            var i, len;

            for (i = 0, len = toggleTargets.length; i < len; i++) {
                $(toggleTargets[i]).hide();
            }

            $openTags.show();
        }
    }
});
