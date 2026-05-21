const script = {
    // --- 序章：阶级抉择 ---
    "START": {
        img: "imgs/scene-versailles.png",
        text: "<b>【1789年：旧制度的黄昏】</b><br>法国实行严格的等级制度：第一等级教士与第二等级贵族坐拥庞大资产，却享有免税权。承担国家财政重担的【第三等级】正处于崩溃边缘。国库空虚，饥荒蔓延，一场风暴正在酝酿。<br><br>请选择你的历史身份：",
        btns: [
            { t: "1. 巴黎鞋匠 (底层平民，忍饥挨饿)", next: "COB_1", effect: () => { gameState.role = '鞋匠'; gameState.hunger = 80; gameState.anger = 30; } },
            { t: "2. 工商业主 (资产阶级，追求权利)", next: "MER_1", effect: () => { gameState.role = '业主'; gameState.publicSupport = 40; gameState.royalAuthority = 70; } },
            { t: "3. 青年律师 (知识分子，信仰启蒙)", next: "LAW_1", effect: () => { gameState.role = '律师'; gameState.revolution = 30; gameState.royalAuthority = 80; } }
        ]
    },

    // --- 路径 A：巴黎鞋匠 (生活史与阶级压迫) ---
    "COB_1": {
        img: "imgs/role-cobbler.png",
        text: "<b>【夺命的税金】</b><br>你辛苦补鞋积攒的几枚铜板，被税吏以‘弥补王室亏空’的名义夺走。那是你孩子唯一的晚餐钱。你会：",
        btns: [
            { t: "为了孩子，忍气吞声交出钱财", next: "COB_HUNGER", effect: () => { gameState.hunger += 20; gameState.anger += 10; gameState.royalAuthority += 20; } },
            { t: "愤怒爆发！暴力夺回钱袋", next: "COB_REBEL", effect: () => { gameState.revolution += 20; gameState.anger += 25; } }
        ]
    },

    "COB_HUNGER": {
        img: "imgs/scene-hunger.png",
        text: "<b>【饥饿的沉沦】</b><br>你选择了服从，但饥饿如影随形。你在教堂门口乞求施舍，却撞见教士正秘密将一袋袋精白面粉搬上运往贵族府邸的马车。那是足以救活半条街平民的口粮！",
        btns: [
            { t: "向治安官举报教士贪污救济粮", next: "COB_REPORT", effect: () => { gameState.anger += 30; } },
            { t: "卑微跪求：求教士分一点面粉碎末", next: "COB_BEG", effect: () => { gameState.hunger += 10; gameState.royalAuthority += 10; } }
        ]
    },

    "COB_REPORT": {
        img: "imgs/role-cobbler.png",
        text: "<b>【权力的黑手】</b><br>治安官竟与教士本是一伙。你被污蔑为‘亵渎者’，丢了鞋摊，流落街头。躲雨时，你误打误撞进了一家烟雾缭绕、激辩声不断的咖啡馆。",
        btns: [
            { t: "在角落旁听启蒙思想家的演说", next: "COB_COFFEE_AWAKE", effect: () => { gameState.revolution += 8; } }
        ]
    },

    "COB_BEG": {
        img: "imgs/scene-begging.png",
        text: "<b>【最后的尊严】</b><br>教士厌恶地踢开了你：‘这是上帝赐予优等人的，贱民不配。’你饿晕在街角，醒来时，一个眼神坚定的年轻人正喂你喝稀汤，他手里攥着名为《人权》的小册子。",
        btns: [
            { t: "听年轻人讲述‘天赋人权’的道理", next: "COB_YOUTH_AWAKE", effect: () => { gameState.anger += 20; gameState.revolution += 10; } }
        ]
    },

    "COB_COFFEE_AWAKE": {
        img: "imgs/scene-coffee.png",
        text: "<b>【咖啡馆的觉醒】</b><br>你接触到启蒙运动学说，卢梭的“人权”教导让你意识到贫穷并非天命，而是制度的枷锁。听闻国王因破产被迫召开三级会议……",
        btns: [
            { t: "作为底层代表，加入前往凡尔赛的队伍", next: "ESTATES_GENERAL", effect: () => { gameState.revolution += 25; gameState.anger += 15; } },
            { t: "恐惧退缩：试图逃回乡下躲避风暴", next: "ESCAPE_FAIL", effect: () => { gameState.revolution -= 15; gameState.royalAuthority += 10; } }
         ]
    },

    "COB_YOUTH_AWAKE": {
        img: "imgs/scene-pleadge.png",
        text: "<b>【写满血泪的《陈情书》】</b><br>‘我们不仅要面包，还要做人的权利。’年轻人帮你把教士的恶行写进了《陈情书》，并要你当代表把《陈情书》带到三级会议……",
        btns: [
            { t: "参与推选代表，亲自带着陈情书赴会", next: "ESTATES_GENERAL", effect: () => { gameState.publicSupport += 20; gameState.revolution += 10; } },
            { t: "恐惧退缩：试图逃回乡下躲避风暴", next: "ESCAPE_FAIL", effect: () => { gameState.revolution -= 15; gameState.royalAuthority += 10; } }
        ]
    },

    "COB_REBEL": {
        img: "imgs/scene-revolt.png",
        text: "<b>【地下的火种】</b><br>你成了通缉犯，只能离开家，躲在贫民窟。思想激进的年轻人告诉你：国王开‘三级会议’只是为了更合法地抢劫平民。",
        btns: [
            { t: "煽动贫民起义，反抗密探搜捕", next: "COB_PRE_ESTATE", effect: () => { gameState.revolution += 25; gameState.anger += 20; } },
            { t: "协助地下组织搬运秘密印刷的启蒙书籍", next: "CAHIERS_REFORM", effect: () => { gameState.publicSupport += 20; gameState.revolution += 15; } }
        ]
    },

    // --- 路径 B：工商业主 (经济与不公) ---
    "MER_1": {
        img: "imgs/role-merchant.png",
        text: "<b>【不平等的商战】</b><br>你经营的工场利润丰厚，但身为第三等级，你必须缴纳沉重的厘金；而贵族领主享有【免税权】且强征你的土地。",
        btns: [
            { t: "卑躬屈膝，寻求贵族的庇护", next: "MER_BANKRUPT", effect: () => { gameState.royalAuthority += 15; } },
            { t: "寻找律师，通过法律维护私有财产", next: "MER_LAWSUIT", effect: () => { gameState.publicSupport += 15; gameState.anger += 10; } }
        ]
    },

    "MER_BANKRUPT": {
        img: "imgs/mer-bankrupt.png",
        text: "<b>【破产的清算】</b><br>贵族收钱后反悔，将经营权给了亲信，王室还宣布赖账。你意识到：没有政治权利，就没有财产安全。",
        btns: [
            { t: "组织商会罢市，抗议王室赖账", next: "MER_PRE_ESTATE", effect: () => { gameState.revolution += 35; gameState.royalAuthority -= 10; } },
            { t: "资助平民代表竞选，寄希望于会议", next: "MER_REPRESENT", effect: () => { gameState.publicSupport += 20; gameState.royalAuthority += 10; } },
        ]
    },

    "MER_LAWSUIT": {
        img: "imgs/mer-lawsuit.png",
        text: "<b>【被封锁的生路】</b><br>法官嘲笑你：‘没封号的商人也敢挑战贵族？’工场被封，你深感旧制度已是经济的绊脚石。",
        btns: [
            { t: "秘密起草一份经济诉求《陈情书》", next: "CAHIERS_REFORM", effect: () => { gameState.publicSupport += 25; gameState.anger += 15; } }
        ]
    },

    "MER_REPRESENT": {
        img: "imgs/mer-represent.png",
        text: "<b>【合理的反抗】</b><br>你把钱袋子投向那些在咖啡馆里慷慨陈词的平民代表，他们也决定把你的事情反应到三级会议。",
        btns: [
            { t: "你资助的代表们身着黑衣，带着你的期望进入三级会议", next: "ESTATES_GENERAL", effect: () => { gameState.publicSupport += 25; gameState.anger += 10; } }
        ]
    },

    // --- 路径 C：青年律师 (思想与理想) ---
    "LAW_1": {
        img: "imgs/role-lawyer.png",
        text: "<b>【黑暗的法庭】</b><br>你信仰天赋人权。在法庭上，你为一个被贵族撞伤的农民辩护，法官却撕毁证词，宣称贵族凌驾于法律之上。",
        btns: [
            { t: "隐忍离场，感叹法律的腐朽", next: "LAW_PRISON", effect: () => { gameState.anger += 20; } },
            { t: "在庭外向民众慷慨宣读启蒙思想", next: "LAW_EXILE", effect: () => { gameState.revolution += 15; gameState.anger += 10; } }
        ]
    },

    "LAW_PRISON": {
        img: "imgs/law-prison.png",
        text: "<b>【巴士底狱的阴影】</b><br>你的好友因‘密札’关入巴士底狱。你意识到：专制王权是所有公民的枷锁。",
        btns: [
            { t: "联名要求废除非法逮捕权", next: "LAW_LAWSUIT", effect: () => { gameState.royalAuthority -= 15; } },
            { t: "撰写册子《什么是第三等级？》并散发", next: "CAHIERS_REFORM", effect: () => { gameState.revolution += 15; gameState.publicSupport += 15; } }
        ]
    },

    "LAW_EXILE": {
        img: "imgs/law-exile.png",
        text: "<b>【思想的火种】</b><br>你创办地下报纸，向饥饿的平民解释为什么我们需要一部【宪法】来限制王权。",
        btns: [
            { t: "号召选举平民代表，废除旧制度", next: "CAHIERS_REFORM", effect: () => { gameState.publicSupport += 30; gameState.revolution += 20; } }
        ]
    },

    "LAW_LAWSUIT": {
        img: "imgs/law-lawsuit.png",
        text: "<b>【王权的清算】</b><br>你联合了巴黎的商会首领签署了一份请愿书递交给路易十六，但国王的顾问们认为这是对神圣王权的公然挑衅，你的名字被列入了秘密警察的监控名单",
        btns: [
            { t: "号召选举平民代表，废除旧制度", next: "CAHIERS_REFORM", effect: () => { gameState.publicSupport += 30; gameState.revolution += 20; } },
            { t: "认栽并缴纳巨额罚款以求自保", next: "LAW_BANKRUPT", effect: () => { gameState.revolution -= 20; gameState.royalAuthority += 20; } }
        ]
    },

    "LAW_BANKRUPT": {
        img: "imgs/law-bankrupt.png",
        text: "<b>【倾家荡产】</b><br>官僚们发现你“花钱买平安”的态度后，变本加厉地罗织罪名，你的朋友依然在监狱里，而你的流动资金已经枯竭。",
        btns: [
            { t: "支持平民激进派领袖，废除旧制度", next: "CAHIERS_REFORM", effect: () => { gameState.publicSupport += 30; gameState.revolution += 20; } }
        ]
    },

    "CAHIERS_REFORM": {
        img: "imgs/scene-pleadge.png",
        text: "<b>【写满血泪的《陈情书》】</b><br>愤怒汇集成了一本本《陈情书》。国王因支援美国独立战争而财政破产，被迫宣布重启关闭175年的三级会议。民众推选你作为代表前往凡尔赛。",
        btns: [
            { t: "1. 义无反顾：带着诉求前往凡尔赛", next: "ESTATES_GENERAL", effect: () => { gameState.publicSupport += 20; gameState.revolution += 10; } },
            { t: "2. 恐惧退缩：试图逃回乡下躲避风暴", next: "ESCAPE_FAIL", effect: () => { gameState.revolution -= 15; gameState.royalAuthority += 10; } }
        ]
    },

    "COB_PRE_ESTATE": {
        img: "imgs/scene-rebelt.png",
        text: "<b>【火药桶被点燃】</b><br>你的行动引发了骚乱。国王为了寻求加税的‘合法性’，被迫宣布召开三级会议。你必须去会场面对那个男人。",
        btns: [
            { t: "1. 挺进凡尔赛，从街头转向会场", next: "ESTATES_GENERAL", effect: () => { gameState.revolution += 10; } },
            { t: "2. 怀疑是陷阱，试图潜逃避风头", next: "ESCAPE_FAIL", effect: () => { gameState.revolution -= 15; gameState.royalAuthority += 10; } }
        ]
    },

    "MER_PRE_ESTATE": {
        img: "imgs/mer-preestate.png",
        text: "<b>【全国罢市的影响】</b><br>工商业主的抵制让国库见底。路易十六不得不妥协，重启会议。这是你争取政治权利的唯一机会。",
        btns: [
            { t: "1. 带着经济方案，正式赴会", next: "ESTATES_GENERAL", effect: () => { gameState.revolution += 20; } },
            { t: "2. 担心波及家产，尝试逃避", next: "ESCAPE_FAIL", effect: () => { gameState.revolution -= 15; gameState.royalAuthority += 10; } }
        ]
    },

    "ESCAPE_FAIL": {
        img: "imgs/scene-escape.png",
        text: "<b>【命运：无处可逃】</b><br>路口已被饥民和宪兵封锁。邻居拉住你喊：‘你是我们中唯一识字/有胆量的人，你不去谁去？’在时代洪流下，你被迫登上了前往凡尔赛的马车。",
        btns: [
            { t: "叹了口气，整理衣冠参加三级会议", next: "ESTATES_GENERAL", effect: () => { gameState.anger += 5; gameState.revolution += 5; } }
        ]
    },

    "ESTATES_GENERAL": {
        img: "imgs/scene-versailles.png",
        text: "<b>【三级会议的骗局】</b><br>凡尔赛宫内，路易十六坚持‘一级一票’——教士与贵族总能2比1稳赢。平民代表要求‘按人头计票’，被粗暴拒绝。",
        btns: [
            { t: "愤而退席！宣布成立‘国民议会’", next: "TENNIS_COURT", effect: () => { gameState.revolution += 15; gameState.royalAuthority -= 30; } },
            { t: "在场内继续争取，最后被卫兵驱逐", next: "TENNIS_COURT", effect: () => { gameState.anger += 20; gameState.royalAuthority += 20; } }
        ]
    },

    "TENNIS_COURT": {
        img: "imgs/scene-tenniscourt.png",
        text: "<b>【网球场宣誓】</b><br>会场被锁，你们转入网球场庄严宣誓：‘不制定宪法，决不解散！’<br><br>此刻，巴黎的钟声已响，你要与国王进行最后的对峙：",
        btns: [
            { t: "作为代表，当面质问路易十六", next: "AI_KING" }
        ]
    },

    "AI_KING": {
        img: "imgs/scene-louisAuguste.png",
        text: "<b>【最终对峙：凡尔赛宫】</b><br>你作为代表站在路易十六面前。",
        btns: [
            { t: "质问国王...", next: "AI_KING" }
        ]
    },

    "REVOLT": {
        img: "imgs/scene-bastille.png",
        text: "<b>【历史结局：攻陷巴士底狱】</b><br>1789年7月14日，谈判彻底破裂。随着一声炮响，愤怒的民众冲向了巴士底监狱！<br><br><b>革命爆发，法国历史改写。</b>",
        btns: [{ t: "继续：查看你的历史命运", next: "ENDING" }]
    },

    "ENDING": {
        img: "imgs/scene-bastille.png",
        text: "",
        btns: [{ t: "🏁 本角色体验结束，返回大厅", next: "MENU" }]
    }
};