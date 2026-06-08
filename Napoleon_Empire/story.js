const script = {
    "START": {
        text: "1804年，拿破仑加冕称帝，法兰西第一帝国成立。在接下来这十年的风起云涌中，你将以何种身份，见证这段波澜壮阔的历史？",
        img: "assets/start_bg.png",
        choices: [
            { text: "帝国军官（参与征服欧洲）", target: "officer_1" },
            { text: "内政法官（参与法典与建设）", target: "judge_1" },
            { text: "反法同盟军（反抗法国扩张）", target: "coalition_1" }
        ]
    },

    // ================= 帝国军官线 =================
    "officer_1": {
        text: "作为拿破仑的亲信将领，你深知帝国版图几乎涵盖整个欧洲。但为了封锁英国，皇帝实施了“大陆封锁政策”。如今俄国公然违约与英国通商，皇帝召集将领商议对策。",
        img: "assets/officer_bg.png",
        choices: [
            { text: "【顺应历史】支持皇帝，集结六十万大军远征俄国！", target: "officer_2", effect: { army: 50, morale: 20, dev: 0 } },
            { text: "【违背历史】建议放弃封锁，与英国和谈，发展国内经济。", target: "officer_2", effect: { wealth: 30, morale: -10, dev: 40 } },
            { text: "【偏离历史】建议只派小股精锐骚扰俄国边境，稳固基本盘。", target: "officer_2", effect: { army: 10, order: 20, dev: 20 } }
        ]
    },
    "officer_2": {
        text: "1812年，远征军遭遇了俄军可怕的“坚壁清野”。莫斯科化为火海，凛冬将至，部队补给断绝。作为先锋官，面临全军覆没的危险，你如何抉择？",
        img: "assets/russia_campaign.png",
        choices: [
            { text: "【顺应历史】掩护主力，在冰天雪地中悲惨撤退。", target: "officer_ai", effect: { army: -60, morale: -40, dev: 0 } },
            { text: "【违背历史】抗命不退！带领残兵强攻圣彼得堡！", target: "officer_ai", effect: { army: -80, morale: -50, dev: 50 } },
            { text: "【偏离历史】抛弃大部队，带着亲信搜刮财富提前逃回巴黎。", target: "officer_ai", effect: { wealth: 40, army: -50, dev: 30 } }
        ]
    },
    "officer_ai": {
        text: "第六次反法同盟兵临巴黎城下。在枫丹白露宫，拿破仑面临着被迫退位的绝境。皇帝双眼充血，盯着你这个曾经的亲信将领，准备进行最后的对话……",
        img: "assets/paris_fall.png",
        ai_eval: true,
        ai_role: "officer"
    },

    // ================= 内政法官线 =================
    "judge_1": {
        text: "大革命带来了动荡，但拿破仑需要秩序。你被任命为内政官员。皇帝要求你主导编纂一部新的民法典，确立帝国的基石。",
        img: "assets/judge_bg.png",
        choices: [
            { text: "【顺应历史】将“自由、平等、私有财产神圣不可侵犯”纳入法典。", target: "judge_2", effect: { order: 40, wealth: 10, dev: 0 } },
            { text: "【违背历史】全面恢复封建特权，讨好旧贵族以换取他们的支持。", target: "judge_2", effect: { wealth: 30, morale: -30, dev: 50 } },
            { text: "【偏离历史】实行极端的平均主义，没收所有富人财产分给穷人。", target: "judge_2", effect: { morale: 40, order: -30, dev: 30 } }
        ]
    },
    "judge_2": {
        text: "《拿破仑法典》颁布后，帝国运转良好。但长期的战争和“大陆封锁”导致国库空虚，物价飞涨。民众怨声载道，财政濒临崩溃。",
        img: "assets/civil_code.png",
        choices: [
            { text: "【顺应历史】设立法兰西银行，整顿财政，严格控制物价。", target: "judge_ai", effect: { wealth: 20, order: 20, dev: 0 } },
            { text: "【违背历史】暗中印制假钞，向欧洲其他国家倾销以转嫁危机。", target: "judge_ai", effect: { wealth: 50, alliance: -20, dev: 40 } },
            { text: "【偏离历史】无视经济危机，强行向民众征收重税支援前线。", target: "judge_ai", effect: { wealth: 40, morale: -40, dev: 20 } }
        ]
    },
    "judge_ai": {
        text: "拿破仑在滑铁卢遭遇最终的惨败。波旁王朝复辟，欧洲保守派巨头在维也纳会议上试图彻底抹除大革命的痕迹。你作为法典的起草者，站在了审判台上面对保守势力代表……",
        img: "assets/code_legacy.png",
        ai_eval: true,
        ai_role: "judge"
    },

    // ================= 反法同盟线 =================
    "coalition_1": {
        text: "你是被法军占领地区的民族主义者。法国大革命带来了自由的思想，但拿破仑的军队却带来了征服与剥削。你决定挺身而出。",
        img: "assets/coalition_bg.png",
        choices: [
            { text: "【顺应历史】利用法国大革命的民族独立思想，暗中组建反抗军。", target: "coalition_2", effect: { alliance: 30, morale: 20, dev: 0 } },
            { text: "【违背历史】彻底投降法国，成为拿破仑在当地的傀儡统治者。", target: "coalition_2", effect: { wealth: 40, alliance: -30, dev: 50 } },
            { text: "【偏离历史】不谈思想，单纯依靠走私英国货物积累资金和武器。", target: "coalition_2", effect: { wealth: 30, alliance: 10, dev: 20 } }
        ]
    },
    "coalition_2": {
        text: "1812年，拿破仑远征俄国惨败的消息传来。法军精锐丧尽，统治开始动摇。这是你的人民千载难逢的翻身机会！",
        img: "assets/coalition_rise.png",
        choices: [
            { text: "【顺应历史】响应奥普英俄，立刻发动全民起义配合联军反攻！", target: "coalition_ai", effect: { alliance: 50, army: 30, dev: 0 } },
            { text: "【违背历史】害怕法军报复，主动向撤退的法军提供粮食换取自保。", target: "coalition_ai", effect: { wealth: -20, alliance: -40, dev: 40 } },
            { text: "【偏离历史】按兵不动，坐视列强互咬，企图在战后渔翁得利。", target: "coalition_ai", effect: { army: 10, alliance: -10, dev: 20 } }
        ]
    },
    "coalition_ai": {
        text: "1815年，拿破仑彻底战败。但在维也纳会议上，反法同盟的大国君主们（如沙皇亚历山大）企图恢复旧的封建统治，重新瓜分你们的祖国。你站在了大国君主的面前……",
        img: "assets/nations_spring.png",
        ai_eval: true,
        ai_role: "coalition"
    }
};