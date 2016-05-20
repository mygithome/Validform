/*
 * modify add validate in jslint tools
 * 修改并调整语法,优化代码
 * Validform version 5.3.2 
 * Based on v 5.3.2
 * Date 2016.5.20
 */
/*global jQuery*/
(function ($, win, undef) {
    'use strict';
    /**
     * @return {boolean}
     */
    var errorObj = null, msgObj = null, msgHidden = true, checkTipCss = ".Validform_checktip", setCenter;
    var tipMsg = {
        tit: "提示信息",
        w: {
            "*": "不能为空！",
            "*6-16": "请填写6到16位任意字符！",
            "n": "请填写数字！",
            "n6-16": "请填写6到16位数字！",
            "s": "不能输入特殊字符！",
            "s6-18": "请填写6到18位字符！",
            "p": "请填写邮政编码！",
            "m": "请填写手机号码！",
            "e": "邮箱地址格式不对！",
            "url": "请填写网址！",
            "idcard": "身份证格式不正确！"
        },
        def: "请填写正确信息！",
        undef: "datatype未定义！",
        reck: "两次输入的内容不一致！",
        r: "",
        c: "正在检测信息…",
        s: "请{填写|选择}{0|信息}！",
        v: "所填信息没有经过验证，请稍后…",
        p: "正在提交数据…"
    };

    var checkInited = function (t1) {
        if (t1.validform_inited === "inited") {
            return true;
        }
        t1.validform_inited = "inited";
    };

    function creatMsgbox() {
        if ($("#Validform_msg").length !== 0) {
            return false;
        }
        msgObj = $('<div id="Validform_msg"><div class="Validform_title">' + tipMsg.tit + '<a class="Validform_close" href="javascript:void(0);">&chi;</a></div><div class="Validform_info"></div><div class="iframe"><iframe frameborder="0" scrolling="no" height="100%" width="100%"></iframe></div></div>').appendTo("body");//提示信息框;
        msgObj.find("a.Validform_close").click(function () {
            msgObj.hide();
            msgHidden = true;
            if (errorObj) {
                errorObj.focus().addClass("Validform_error");
            }
            return false;
        }).focus(function () {
            this.blur();
        });

        $(window).bind("scroll resize", function () {
            if (!msgHidden) {
                setCenter(msgObj, 400);
            }
        });
    }

    /**
     * @return {boolean}
     */
    var ValidForm = function (forms, settings, inited) {
        var sets = $.extend({}, ValidForm.defaults, settings), brothers = this;
        if (sets.datatype) {
            $.extend(ValidForm.util.dataType, sets.datatype);
        }
        brothers.tipmsg = {w: {}};
        brothers.forms = forms;
        brothers.objects = [];
        //创建子对象时不再绑定事件;
        if (true === inited) {
            return false;
        }
        forms.each(function () {
            //已经绑定事件时跳过，避免事件重复绑定;
            var curForm = this;
            checkInited(curForm);
            curForm.settings = $.extend({}, sets);
            var $this = $(curForm);
            //防止表单按钮双击提交两次;
            curForm.validform_status = "normal"; //normal | posting | posted;
            //让每个Validform对象都能自定义tipmsg;
            $this.data("tipMsg", brothers.tipmsg);
            //bind the blur event;
            $this.delegate("[datatype]", "blur", function (a1, a2) {
                //判断是否是在提交表单操作时触发的验证请求；
                ValidForm.util.check.call(this, $this, a2);
            });

            $this.delegate(":text", "keypress", function (event) {
                if (event.keyCode === 13 && $this.find(":submit").length === 0) {
                    $this.submit();
                }
            });

            //点击表单元素，默认文字消失效果;
            //表单元素值比较时的信息提示增强;
            //radio、checkbox提示信息增强;
            //外调插件初始化;
            ValidForm.util.enhance.call($this, curForm.settings.tiptype, curForm.settings.usePlugin, curForm.settings.tipSweep);
            var btnSubmit = curForm.settings.btnSubmit;
            $this.find(btnSubmit).bind("click", function () {
                $this.trigger("submit");
                return false;
            });

            $this.submit(function () {
                var subflag = ValidForm.util.submitForm.call($this, curForm.settings);
                if (subflag === undef) {
                    subflag = true;
                }
                return subflag;
            });

            $this.find("[type='reset']").add($this.find(curForm.settings.btnReset)).bind("click", function () {
                ValidForm.util.resetForm.call($this);
            });
        });
        //预创建pop box;
        if ((sets.tiptype === 1 || (sets.tiptype === 2 || sets.tiptype === 3)) && sets.ajaxPost) {
            creatMsgbox();
        }
    };

    ValidForm.defaults = {
        tiptype: 1,
        tipSweep: false,
        showAllError: false,
        postonce: false,
        ajaxPost: false
    };
    function setCallback(settings, data) {
        if (settings.callback) {
            settings.callback(data);
        }
    }

    ValidForm.util = {
        dataType: {
            "*": /[\w\W]+/,
            "*6-16": /^[\w\W]{6,16}$/,
            "n": /^\d+$/,
            "n6-16": /^\d{6,16}$/,
            "s": /^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]+$/,
            "s6-18": /^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]{6,18}$/,
            "p": /^[0-9]{6}$/,
            "m": /^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}|17[0-9]{9}$/,
            "e": /^\w+([\-+.']\w+)*@\w+([\-.]\w+)*\.\w+([\-.]\w+)*$/,
            "url": /^(\w+:\/\/)?\w+(\.\w+)+.*$/,
            "idcard": /^\d{15}(\d{2}[A-Za-z0-9])?$/
        },

        toString: Object.prototype.toString,

        isEmpty: function (val) {
            return val === "" || val === $.trim(this.attr("tip"));
        },

        getValue: function (obj) {
            var inputval, curform = this;
            if (obj.is(":radio")) {
                inputval = curform.find(":radio[name='" + obj.attr("name") + "']:checked").val();
                inputval = inputval === undef ? "" : inputval;
            } else if (obj.is(":checkbox")) {
                inputval = "";
                curform.find(":checkbox[name='" + obj.attr("name") + "']:checked").each(function () {
                    inputval += $(this).val() + ',';
                });
                inputval = inputval === undef ? "" : inputval;
            } else {
                inputval = obj.val();
            }
            inputval = $.trim(inputval);

            return ValidForm.util.isEmpty.call(obj, inputval) ? "" : inputval;
        },

        enhance: function (tiptype, usePlugin, tipSweep, addRule) {
            var curform = this;
            //页面上不存在提示信息的标签时，自动创建;
            curform.find("[datatype]").each(function () {
                var formControls = $(this).parents(".formControls").next(), valide_checkTip = checkTipCss,
                    addSpan = "<span class='" + checkTipCss.replace(".", "") + "' ></span>";
                if (tiptype === 2) {
                    if (formControls.find(valide_checkTip).length === 0) {
                        formControls.append(addSpan);
                        $(this).siblings(valide_checkTip).remove();
                    }
                } else if (tiptype === 3 || tiptype === 4) {
                    if ($(this).siblings(valide_checkTip).length === 0) {
                        $(this).parent().append(addSpan);
                        $(this).parent().next().find(valide_checkTip).remove();
                        formControls.find(valide_checkTip).remove();
                    }
                }
            });

            //表单元素值比较时的信息提示增强;
            curform.find("input[recheck]").each(function () {
                //已经绑定事件时跳过;
                var $this = $(this), recheckInput = curform.find("input[name='" + $(this).attr("recheck") + "']");
                var tipF = function () {
                    if (recheckInput.val() !== $this.val() && $this.val() !== "") {
                        if ($this.attr("tip")) {
                            if ($this.attr("tip") === $this.val()) {
                                return false;
                            }
                        }
                        $this.trigger("blur");
                    }
                };
                checkInited(this);
                recheckInput.bind("keyup", tipF).bind("blur", tipF);
            });

            //hasDefaultText;
            curform.find("[tip]").each(function () {//tip是表单元素的默认提示信息,这是点击清空效果;
                //已经绑定事件时跳过;
                checkInited(this);
                var defaultvalue = $(this).attr("tip");
                var altercss = $(this).attr("altercss");
                $(this).focus(function () {
                    if ($(this).val() === defaultvalue) {
                        $(this).val('');
                        if (altercss) {
                            $(this).removeClass(altercss);
                        }
                    }
                }).blur(function () {
                    if ($.trim($(this).val()) === '') {
                        $(this).val(defaultvalue);
                        if (altercss) {
                            $(this).addClass(altercss);
                        }
                    }
                });
            });

            //enhance info feedback for checkbox & radio;
            curform.find(":checkbox[datatype],:radio[datatype]").each(function () {
                //已经绑定事件时跳过;
                checkInited(this);
                var this$ = $(this);
                var name = this$.attr("name");
                curform.find("[name='" + name + "']").filter(":checkbox,:radio").bind("click", function () {
                    //避免多个事件绑定时的取值滞后问题;
                    setTimeout(function () {
                        this$.trigger("blur");
                    }, 0);
                });

            });

            //select multiple;
            curform.find("select[datatype][multiple]").bind("click", function () {
                var $this = $(this);
                setTimeout(function () {
                    $this.trigger("blur");
                }, 0);
            });

            //plugins here to start;
            ValidForm.util.usePlugin.call(curform, usePlugin, tiptype, tipSweep, addRule);
        },

        usePlugin: function (plugin1, tiptype, tipSweep, addRule) {
            /*
             plugin:settings.usePlugin;
             tiptype:settings.tiptype;
             tipSweep:settings.tipSweep;
             addRule:是否在addRule时触发;
             */

            var curform = this, plugin = plugin1 || {};
            //swfupload;
            /*global swfuploadhandler */
            if (curform.find("input[plugin='swfupload']").length && swfuploadhandler !== undefined) {

                var custom = {
                    custom_settings: {
                        form: curform,
                        showmsg: function (msg, type) {
                            ValidForm.util.showmsg.call(curform, msg, tiptype, {
                                obj: curform.find("input[plugin='swfupload']"),
                                type: type,
                                sweep: tipSweep
                            });
                        }
                    }
                };

                custom = $.extend(true, {}, plugin.swfupload, custom);

                curform.find("input[plugin='swfupload']").each(function (n) {
                    checkInited(this);
                    $(this).val("");
                    /*global swfuploadhandler */
                    swfuploadhandler.init(custom, n);
                });

            }

            //datepicker;
            if (curform.find("input[plugin='datepicker']").length && $.fn.datePicker) {
                plugin.datepicker = plugin.datepicker || {};

                if (plugin.datepicker.format) {
                    Date.format = plugin.datepicker.format;
                    delete plugin.datepicker.format;
                }
                if (plugin.datepicker.firstDayOfWeek) {
                    Date.firstDayOfWeek = plugin.datepicker.firstDayOfWeek;
                    delete plugin.datepicker.firstDayOfWeek;
                }

                curform.find("input[plugin='datepicker']").each(function () {
                    checkInited(this);
                    /*global datePicker*/
                    if (plugin.datepicker.callback) {
                        $(this).bind("dateSelected", function () {
                            /*jslint nomen: true */
                            var d = new Date($.event._dpCache[this._dpId].getSelected()[0]).asString(Date.format);
                            plugin.datepicker.callback(d, this);
                        });
                    }
                    $(this).datePicker(plugin.datepicker);
                });
            }
            //passwordstrength;
            if (curform.find("input[plugin*='passwordStrength']").length && $.fn.passwordStrength) {
                plugin.passwordstrength = plugin.passwordstrength || {};
                plugin.passwordstrength.showmsg = function (obj, msg, type) {
                    ValidForm.util.showmsg.call(curform, msg, tiptype, {obj: obj, type: type, sweep: tipSweep});
                };

                curform.find("input[plugin='passwordStrength']").each(function () {
                    checkInited(this);
                    $(this).passwordStrength(plugin.passwordstrength);
                });
            }

            //jqtransform;
            if (addRule !== "addRule" && plugin.jqtransform && $.fn.jqTransSelect) {
                if (curform[0].jqTransSelected === "true") {
                    return;
                }
                curform[0].jqTransSelected = "true";

                var jqTransformHideSelect = function (oTarget) {
                    var ulVisible = $('.jqTransformSelectWrapper ul:visible');
                    ulVisible.each(function () {
                        var oSelect = $(this).parents(".jqTransformSelectWrapper:first").find("select").get(0);
                        //do not hide if click on the label object associated to the select
                        if (!(oTarget && oSelect.oLabel && oSelect.oLabel.get(0) === oTarget.get(0))) {
                            $(this).hide();
                        }
                    });
                };

                /* Check for an external click */
                var jqTransformCheckExternalClick = function (event) {
                    if ($(event.target).parents('.jqTransformSelectWrapper').length === 0) {
                        jqTransformHideSelect($(event.target));
                    }
                };

                var jqTransformAddDocumentListener = function () {
                    $(document).mousedown(jqTransformCheckExternalClick);
                };

                var jqtransformSelector = plugin.jqtransform.selector;
                if (jqtransformSelector) {
                    var find = curform.find(jqtransformSelector);
                    find.filter('input:submit, input:reset, input[type="button"]').jqTransInputButton();
                    find.filter('input:text, input:password').jqTransInputText();
                    find.filter('input:checkbox').jqTransCheckBox();
                    find.filter('input:radio').jqTransRadio();
                    find.filter('textarea').jqTransTextarea();
                    if (find.filter("select").length > 0) {
                        find.filter("select").jqTransSelect();
                        jqTransformAddDocumentListener();
                    }

                } else {
                    curform.jqTransform();
                }

                curform.find(".jqTransformSelectWrapper").find("li a").click(function () {
                    $(this).parents(".jqTransformSelectWrapper").find("select").trigger("blur");
                });
            }

        },

        getNullmsg: function (curform) {
            var obj = this;
            var reg = /[\u4E00-\u9FA5\uf900-\ufa2da-zA-Z\s]+/g;
            var nullMsg;
            var label = curform[0].settings.label || ".Validform_label";
            label = obj.siblings(label).eq(0).text() || obj.siblings().find(label).eq(0).text() || obj.parent().siblings(label).eq(0).text() || obj.parent().siblings().find(label).eq(0).text();
            label = label.replace(/\s(?![a-zA-Z])/g, "").match(reg);
            label = label ? label.join("") : [""];
            reg = /\{(.+)\|(.+)\}/;
            nullMsg = curform.data("tipMsg").s || tipMsg.s;

            if (label !== "") {
                nullMsg = nullMsg.replace(/\{0\|(.+)\}/, label);
                if (obj.attr("recheck")) {
                    nullMsg = nullMsg.replace(/\{(.+)\}/, "");
                    obj.attr("nullmsg", nullMsg);
                    return nullMsg;
                }
            } else {
                nullMsg = obj.is(":checkbox,:radio,select") ? nullMsg.replace(/\{0\|(.+)\}/, "") : nullMsg.replace(/\{0\|(.+)\}/, "$1");
            }
            nullMsg = obj.is(":checkbox,:radio,select") ? nullMsg.replace(reg, "$2") : nullMsg.replace(reg, "$1");

            obj.attr("nullmsg", nullMsg);
            return nullMsg;
        },

        getErrormsg: function (curform, datatype, recheck) {
            var regxp = /^(.+?)((\d+)-(\d+))?$/,
                regxp2 = /^(.+?)(\d+)-(\d+)$/,
                regxp3 = /(.*?)\d+(.+?)\d+(.*)/,
                mac = datatype.match(regxp), str;

            //如果是值不一样而报错;
            if (recheck === "recheck") {
                str = curform.data("tipMsg").reck || tipMsg.reck;
                return str;
            }

            var tipmsg_w_ex = $.extend({}, tipMsg.w, curform.data("tipMsg").w);

            //如果原来就有，直接显示该项的提示信息;
            if (tipmsg_w_ex.hasOwnProperty(mac[0])) {
                return curform.data("tipMsg").w[mac[0]] || tipMsg.w[mac[0]];
            }
            //没有的话在提示对象里查找相似;
            var name;
            for (name in tipmsg_w_ex) {
                if (tipmsg_w_ex.hasOwnProperty(name)) {
                    if (name.indexOf(mac[1]) !== -1 && regxp2.test(name)) {
                        str = (curform.data("tipMsg").w[name] || tipMsg.w[name]).replace(regxp3, "$1" + mac[3] + "$2" + mac[4] + "$3");
                        curform.data("tipMsg").w[mac[0]] = str;

                        return str;
                    }
                }
            }

            return curform.data("tipMsg").def || tipMsg.def;
        },
        _regcheck: function (datatype, gets, obj, curform) {
            var info = null,
                passed = false,
                reg = /\/.+\//g,
                regex = /^(.+?)(\d+)-(\d+)$/,
                type = 3;//default set to wrong type, 2,3,4;

            //datatype有三种情况：正则，函数和直接绑定的正则;

            //直接是正则;
            var vu_dataType = ValidForm.util.dataType;
            if (reg.test(datatype)) {
                var regstr = datatype.match(reg)[0].slice(1, -1), param = datatype.replace(reg, ""), rexp = new RegExp(regstr, param);
                passed = rexp.test(gets);
                //function;
            } else if (ValidForm.util.toString.call(vu_dataType[datatype]) === "[object Function]") {
                passed = vu_dataType[datatype](gets, obj, curform, vu_dataType);
                if (passed === true || passed === undef) {
                    passed = true;
                } else {
                    info = passed;
                    passed = false;
                }

                //自定义正则;
            } else {
                //自动扩展datatype;
                // if (!(datatype in vu_dataType)) {
                if (!vu_dataType.hasOwnProperty(datatype)) {
                    var mac = datatype.match(regex), temp;
                    if (!mac) {
                        passed = false;
                        info = curform.data("tipMsg").undef || tipMsg.undef;
                    } else {
                        var dt, str, param2, regxp;
                        for (dt in vu_dataType) {
                            if (vu_dataType.hasOwnProperty(dt)) {
                                temp = dt.match(regex);
                                if (!temp) {
                                    continue;
                                }
                                if (mac[1] === temp[1]) {
                                    str = vu_dataType[dt].toString();
                                    param2 = str.match(/\/[mgi]*/g)[1].replace("\/", "");
                                    regxp = new RegExp("\\{" + temp[2] + "," + temp[3] + "\\}", "g");
                                    str = str.replace(/\/[mgi]*/g, "\/").replace(regxp, "{" + mac[2] + "," + mac[3] + "}").replace(/^\//, "").replace(/\/$/, "");
                                    vu_dataType[datatype] = new RegExp(str, param2);
                                    break;
                                }
                            }
                        }
                    }
                }

                if (ValidForm.util.toString.call(vu_dataType[datatype]) === "[object RegExp]") {
                    passed = vu_dataType[datatype].test(gets);
                }

            }


            if (passed) {
                type = 2;
                info = obj.attr("sucmsg") || curform.data("tipMsg").r || tipMsg.r;

                //规则验证通过后，还需要对绑定recheck的对象进行值比较;
                if (obj.attr("recheck")) {
                    var theother = curform.find("input[dt='" + obj.attr("recheck") + "']:first");
                    if (gets !== theother.val()) {
                        passed = false;
                        type = 3;
                        info = obj.attr("errormsg") || ValidForm.util.getErrormsg.call(obj, curform, datatype, "recheck");
                    }
                }
            } else {
                info = info || obj.attr("errormsg") || ValidForm.util.getErrormsg.call(obj, curform, datatype);

                //验证不通过且为空时;
                if (ValidForm.util.isEmpty.call(obj, gets)) {
                    info = obj.attr("nullmsg") || ValidForm.util.getNullmsg.call(obj, curform);
                }
            }

            return {
                passed: passed,
                type: type,
                info: info
            };

        },

        regcheck: function (datatype, gets, obj) {
            /*
             datatype:datatype;
             gets:inputvalue;
             obj:input object;
             */
            var curform = this,
                info = null;
            if (obj.attr("ignore") === "ignore" && ValidForm.util.isEmpty.call(obj, gets)) {
                if (obj.data("cked")) {
                    info = "";
                }
                return {
                    passed: true,
                    type: 4,
                    info: info
                };
            }

            obj.data("cked", "cked");//do nothing if is the first time validation triggered;

            var dtype = ValidForm.util.parseDatatype(datatype);
            var res, eithor, dtp;
            for (eithor = 0; eithor < dtype.length; eithor++) {
                for (dtp = 0; dtp < dtype[eithor].length; dtp++) {
                    res = ValidForm.util._regcheck(dtype[eithor][dtp], gets, obj, curform);
                    if (!res.passed) {
                        break;
                    }
                }
                if (res.passed) {
                    break;
                }
            }
            return res;

        },

        parseDatatype: function (datatype) {
            /*
             字符串里面只能含有一个正则表达式;
             Datatype名称必须是字母，数字、下划线或*号组成;
             datatype="/regexp/|phone|tel,s,e|f,e";
             ==>[["/regexp/"],["phone"],["tel","s","e"],["f","e"]];
             */

            var reg = /\/.+?\/[mgi]*(?=(,|$|\||\s))|[\w\*\-]+/g,
                dType = datatype.match(reg),
                sArray = datatype.replace(reg, "").replace(/\s*/g, "").split(""),
                arr = [],
                m = 0;
            arr[0] = [];
            arr[0].push(dType[0]);
            var n;
            for (n = 0; n < sArray.length; n++) {
                if (sArray[n] === "|") {
                    m++;
                    arr[m] = [];
                }
                arr[m].push(dType[n + 1]);
            }

            return arr;
        },

        showmsg: function (msg, type, o, triggered) {
            /*
             msg:提示文字;
             type:提示信息显示方式;
             o:{obj:当前对象, type:1=>正在检测 | 2=>通过, sweep:true | false},
             triggered:在blur或提交表单触发的验证中，有些情况不需要显示提示文字，如自定义弹出提示框的显示方式，不需要每次blur时就马上弹出提示;

             tiptype:1\2\3时都有坑能会弹出自定义提示框
             tiptype:1时在triggered bycheck时不弹框
             tiptype:2\3时在ajax时弹框
             tipSweep为true时在triggered bycheck时不触发showmsg，但ajax出错的情况下要提示
             */

            //如果msg为undefined，那么就没必要执行后面的操作，ignore有可能会出现这情况;
            if (msg === undef) {
                return;
            }

            //tipSweep为true，且当前不是处于错误状态时，blur事件不触发信息显示;
            if (triggered === "bycheck" && o.sweep && o.obj && ((!o.obj.is(".Validform_error") || typeof type === "function"))) {
                return;
            }

            $.extend(o, {curform: this});

            if (typeof type === "function") {
                type(msg, o, ValidForm.util.cssctl);
                return;
            }

            if ((type === 1 || triggered === "byajax") && type !== 4) {
                msgObj.find(".Validform_info").html(msg);
            }

            //tiptypt=1时，blur触发showmsg，验证是否通过都不弹框，提交表单触发的话，只要验证出错，就弹框;
            if ((type === 1 && triggered !== "bycheck" && o.type !== 2) || (triggered === "byajax" && type !== 4)) {
                msgHidden = false;
                msgObj.find(".iframe").css("height", msgObj.outerHeight());
                msgObj.show();
                setCenter(msgObj, 100);
            }


            if (type === 2 && o.obj) {
                o.obj.parents(".formControls").next().find(checkTipCss).html(msg);
                ValidForm.util.cssctl(o.obj.parents(".formControls").next().find(checkTipCss), o.type);
            }

            if ((type === 3 || type === 4) && o.obj) {
                o.obj.siblings(checkTipCss).html(msg);
                ValidForm.util.cssctl(o.obj.siblings(checkTipCss), o.type);
            }

        },

        cssctl: function (obj, status) {
            switch (status) {
                case 1:
                    obj.removeClass("Validform_right Validform_wrong").addClass("Validform_checktip Validform_loading");//checking;
                    break;
                case 2:
                    obj.removeClass("Validform_wrong Validform_loading").addClass("Validform_checktip Validform_right");//passed;
                    break;
                case 4:
                    obj.removeClass("Validform_right Validform_wrong Validform_loading").addClass("Validform_checktip");//for ignore;
                    break;
                default:
                    obj.removeClass("Validform_right Validform_loading").addClass("Validform_checktip Validform_wrong");//wrong;
            }
        },

        check: function (curform, subposts, bool) {
            /*
             检测单个表单元素;
             验证通过返回true，否则返回false、实时验证返回值为ajax;
             bool，传入true则只检测不显示提示信息;
             */
            var settings = curform[0].settings;
            var subpost = subposts || "";
            var inputval = ValidForm.util.getValue.call(curform, $(this));

            //隐藏或绑定dataIgnore的表单对象不做验证;
            if ((settings.ignoreHidden && $(this).is(":hidden")) || $(this).data("dataIgnore") === "dataIgnore") {
                return true;
            }

            //dragonfly=true时，没有绑定ignore，值为空不做验证，但验证不通过;
            if (settings.dragonfly && !$(this).data("cked") && ValidForm.util.isEmpty.call($(this), inputval) && $(this).attr("ignore") !== "ignore") {
                return false;
            }

            var flag = ValidForm.util.regcheck.call(curform, $(this).attr("datatype"), inputval, $(this));

            //值没变化不做检测，这时要考虑recheck情况;
            //不是在提交表单时触发的ajax验证;
            if (inputval === this.validform_lastval && !$(this).attr("recheck") && subpost === "") {
                return flag.passed;
            }

            this.validform_lastval = inputval;//存储当前值;

            var $this;
            errorObj = $this = $(this);

            if (!flag.passed) {
                //取消正在进行的ajax验证;
                ValidForm.util.abort.call($this[0]);

                if (!bool) {
                    //传入"bycheck"，指示当前是check方法里调用的，当tiptype=1时，blur事件不让触发错误信息显示;
                    ValidForm.util.showmsg.call(curform, flag.info, settings.tiptype, {
                        obj: $(this),
                        type: flag.type,
                        sweep: settings.tipSweep
                    }, "bycheck");
                    if (!settings.tipSweep) {
                        $this.addClass("Validform_error");
                    }
                }
                return false;
            }

            //验证通过的话，如果绑定有ajaxurl，要执行ajax检测;
            //当ignore="ignore"时，为空值可以通过验证，这时不需要ajax检测;
            var ajaxurl = $(this).attr("ajaxurl");
            if (ajaxurl && !ValidForm.util.isEmpty.call($(this), inputval) && !bool) {
                var inputobj = $(this);

                //当提交表单时，表单中的某项已经在执行ajax检测，这时需要让该项ajax结束后继续提交表单;
                if (subpost === "postform") {
                    inputobj[0].validform_subpost = "postform";
                } else {
                    inputobj[0].validform_subpost = "";
                }

                if (inputobj[0].validform_valid === "posting" && inputval === inputobj[0].validform_ckvalue) {
                    return "ajax";
                }

                inputobj[0].validform_valid = "posting";
                inputobj[0].validform_ckvalue = inputval;
                ValidForm.util.showmsg.call(curform, curform.data("tipMsg").c || tipMsg.c, settings.tiptype, {
                    obj: inputobj,
                    type: 1,
                    sweep: settings.tipSweep
                }, "bycheck");

                ValidForm.util.abort.call($this[0]);

                var ajaxsetup = $.extend(true, {}, settings.ajaxurl || {});

                var localconfig = {
                    type: "POST",
                    cache: false,
                    url: ajaxurl,
                    data: "param=" + encodeURIComponent(inputval) + "&name=" + encodeURIComponent($(this).attr("name")),
                    success: function (data) {
                        if ($.trim(data.status) === "y") {
                            inputobj[0].validform_valid = "true";
                            if (data.info) {
                                inputobj.attr("sucmsg", data.info);
                            }
                            ValidForm.util.showmsg.call(curform, inputobj.attr("sucmsg") || curform.data("tipMsg").r || tipMsg.r, settings.tiptype, {
                                obj: inputobj,
                                type: 2,
                                sweep: settings.tipSweep
                            }, "bycheck");
                            $this.removeClass("Validform_error");
                            errorObj = null;
                            if (inputobj[0].validform_subpost === "postform") {
                                curform.trigger("submit");
                            }
                        } else {
                            inputobj[0].validform_valid = data.info;
                            ValidForm.util.showmsg.call(curform, data.info, settings.tiptype, {
                                obj: inputobj,
                                type: 3,
                                sweep: settings.tipSweep
                            });
                            $this.addClass("Validform_error");
                        }
                        $this[0].validform_ajax = null;
                    },
                    error: function (data) {
                        if (data.status === "200") {
                            if (data.responseText === "y") {
                                ajaxsetup.success({"status": "y"});
                            } else {
                                ajaxsetup.success({"status": "n", "info": data.responseText});
                            }
                            return false;
                        }

                        //正在检测时，要检测的数据发生改变，这时要终止当前的ajax。不是这种情况引起的ajax错误，那么显示相关错误信息;
                        if (data.statusText !== "abort") {
                            var msg = "status: " + data.status + "; statusText: " + data.statusText;

                            ValidForm.util.showmsg.call(curform, msg, settings.tiptype, {
                                obj: inputobj,
                                type: 3,
                                sweep: settings.tipSweep
                            });
                            $this.addClass("Validform_error");
                        }

                        inputobj[0].validform_valid = data.statusText;
                        $this[0].validform_ajax = null;

                        //localconfig.error返回true表示还需要执行temp_err;
                        return true;
                    }
                };

                if (ajaxsetup.success) {
                    var temp_suc = ajaxsetup.success;
                    ajaxsetup.success = function (data) {
                        localconfig.success(data);
                        temp_suc(data, inputobj);
                    };
                }

                if (ajaxsetup.error) {
                    var temp_err = ajaxsetup.error;
                    ajaxsetup.error = function (data) {
                        //localconfig.error返回false表示不需要执行temp_err;
                        localconfig.error(data) && temp_err(data, inputobj);
                    };
                }

                ajaxsetup = $.extend({}, localconfig, ajaxsetup, {dataType: "json"});
                $this[0].validform_ajax = $.ajax(ajaxsetup);
                return "ajax";
            }
            if (ajaxurl && ValidForm.util.isEmpty.call($(this), inputval)) {
                ValidForm.util.abort.call($this[0]);
                $this[0].validform_valid = "true";
            }

            if (!bool) {
                ValidForm.util.showmsg.call(curform, flag.info, settings.tiptype, {
                    obj: $(this),
                    type: flag.type,
                    sweep: settings.tipSweep
                }, "bycheck");
                $this.removeClass("Validform_error");
            }
            errorObj = null;

            return true;

        },

        submitForm: function (settings, flg, url, ajaxPost, sync) {
            /*
             flg===true时跳过验证直接提交;
             ajaxPost==="ajaxPost"指示当前表单以ajax方式提交;
             */
            var curform = this;

            //表单正在提交时点击提交按钮不做反应;
            if (curform[0].validform_status === "posting") {
                return false;
            }

            //要求只能提交一次时;
            if (settings.postonce && curform[0].validform_status === "posted") {
                return false;
            }

            var beforeCheck = settings.beforeCheck && settings.beforeCheck(curform);
            if (beforeCheck === false) {
                return false;
            }

            var flag = true, infoLag;

            curform.find("[datatype]").each(function () {
                var t = this, $t = $(this);
                //跳过验证;
                var inputval = ValidForm.util.getValue.call(curform, $t);
                if (flg) {
                    //隐藏或绑定dataIgnore的表单对象不做验证;
                    return false;
                }

                if ((settings.ignoreHidden && $t.is(":hidden")) || ($t.data("dataIgnore") === "dataIgnore")) {
                    return true;
                }

                infoLag = ValidForm.util.regcheck.call(curform, $t.attr("datatype"), inputval, $t);
                if (!infoLag.passed) {
                    ValidForm.util.showmsg.call(curform, infoLag.info, settings.tiptype, {
                        obj: $(this),
                        type: infoLag.type,
                        sweep: settings.tipSweep
                    });
                    $t.addClass("Validform_error");

                    if (!settings.showAllError) {
                        $t.focus();
                        flag = false;
                        return false;
                    }
                    if (flag) {
                        flag = false;
                    }
                    return true;
                }

                //当ignore="ignore"时，为空值可以通过验证，这时不需要ajax检测;
                if ($t.attr("ajaxurl") && !ValidForm.util.isEmpty.call($t, inputval)) {
                    if (t.validform_valid !== "true") {
                        var thisObj = $(this);
                        ValidForm.util.showmsg.call(curform, curform.data("tipMsg").v || tipMsg.v, settings.tiptype, {
                            obj: thisObj,
                            type: 3,
                            sweep: settings.tipSweep
                        });
                        thisObj.addClass("Validform_error");
                        thisObj.trigger("blur", ["postform"]);//continue the form post;

                        if (!settings.showAllError) {
                            flag = false;
                            return false;
                        }

                        if (flag) {
                            flag = false;
                        }
                        return true;
                    }
                } else if ($t.attr("ajaxurl") && ValidForm.util.isEmpty.call($(this), inputval)) {
                    var t2 = this;
                    ValidForm.util.abort.call(t2);
                    t2.validform_valid = "true";
                }

                ValidForm.util.showmsg.call(curform, infoLag.info, settings.tiptype, {
                    obj: $(this),
                    type: infoLag.type,
                    sweep: settings.tipSweep
                });
                $t.removeClass("Validform_error");
                errorObj = null;
            });

            if (settings.showAllError) {
                curform.find(".Validform_error:first").focus();
            }

            if (flag) {
                var beforeSubmit = settings.beforeSubmit && settings.beforeSubmit(curform);
                if (beforeSubmit === false) {
                    return false;
                }

                curform[0].validform_status = "posting";

                if (settings.ajaxPost || ajaxPost === "ajaxPost") {
                    //获取配置参数;
                    var ajaxsetup = $.extend(true, {}, settings.ajaxpost || {});
                    //有可能需要动态的改变提交地址，所以把action所指定的url层级设为最低;
                    ajaxsetup.url = url || ajaxsetup.url || settings.url || curform.attr("action");

                    //byajax：ajax时，tiptye为1、2或3需要弹出提示框;
                    ValidForm.util.showmsg.call(curform, curform.data("tipMsg").p || tipMsg.p, settings.tiptype, {
                        obj: curform,
                        type: 1,
                        sweep: settings.tipSweep
                    }, "byajax");

                    //方法里的优先级要高;
                    //有undefined情况;
                    if (sync) {
                        ajaxsetup.async = false;
                    } else if (sync === false) {
                        ajaxsetup.async = true;
                    }

                    if (ajaxsetup.success) {
                        var temp_suc = ajaxsetup.success;
                        ajaxsetup.success = function (data) {
                            setCallback(settings, data);
                            curform[0].validform_ajax = null;
                            if ($.trim(data.status) === "y") {
                                curform[0].validform_status = "posted";
                            } else {
                                curform[0].validform_status = "normal";
                            }

                            temp_suc(data, curform);
                        };
                    }

                    if (ajaxsetup.error) {
                        var temp_err = ajaxsetup.error;
                        ajaxsetup.error = function (data) {
                            setCallback(settings, data);
                            curform[0].validform_status = "normal";
                            curform[0].validform_ajax = null;

                            temp_err(data, curform);
                        };
                    }

                    var localconfig = {
                        type: "POST",
                        async: true,
                        data: curform.serializeArray(),
                        success: function (data) {
                            if ($.trim(data.status) === "y") {
                                //成功提交;
                                curform[0].validform_status = "posted";
                                ValidForm.util.showmsg.call(curform, data.info, settings.tiptype, {
                                    obj: curform,
                                    type: 2,
                                    sweep: settings.tipSweep
                                }, "byajax");
                            } else {
                                //提交出错;
                                curform[0].validform_status = "normal";
                                ValidForm.util.showmsg.call(curform, data.info, settings.tiptype, {
                                    obj: curform,
                                    type: 3,
                                    sweep: settings.tipSweep
                                }, "byajax");
                            }

                            setCallback(settings, data);
                            curform[0].validform_ajax = null;
                        },
                        error: function (data) {
                            var msg = "status: " + data.status + "; statusText: " + data.statusText;

                            ValidForm.util.showmsg.call(curform, msg, settings.tiptype, {
                                obj: curform,
                                type: 3,
                                sweep: settings.tipSweep
                            }, "byajax");

                            setCallback(settings, data);
                            curform[0].validform_status = "normal";
                            curform[0].validform_ajax = null;
                        }
                    };

                    ajaxsetup = $.extend({}, localconfig, ajaxsetup, {dataType: "json"});

                    curform[0].validform_ajax = $.ajax(ajaxsetup);

                } else {
                    if (!settings.postonce) {
                        curform[0].validform_status = "normal";
                    }

                    var url_new = url || settings.url;
                    if (url_new) {
                        curform.attr("action", url_new);
                    }

                    return settings.callback && settings.callback(curform);
                }
            }

            return false;

        },
        resetForm: function () {
            var brothers = this;
            brothers.each(function () {
                var bsOne = this;
                if (bsOne.reset) {
                    bsOne.reset();
                }
                bsOne.validform_status = "normal";
            });

            brothers.find(".Validform_right").text("");
            brothers.find(".passwordStrength").children().removeClass("bgStrength");
            brothers.find(".Validform_checktip").removeClass("Validform_wrong Validform_right Validform_loading");
            brothers.find(".Validform_error").removeClass("Validform_error");
            brothers.find("[datatype]").removeData("cked").removeData("dataIgnore").each(function () {
                var dataType = this;
                dataType.validform_lastval = null;
            });
            brothers.eq(0).find("input:first").focus();
        },

        abort: function () {
            if (this.validform_ajax) {
                this.validform_ajax.abort();
            }
        }

    };

    $.Tipmsg = tipMsg;
    $.Datatype = ValidForm.util.dataType;

    ValidForm.prototype = {
        dataType: ValidForm.util.dataType,
        eq: function (n) {
            var obj = this;
            if (n >= obj.forms.length) {
                return null;
            }
            if (!(obj.objects.hasOwnProperty(n))) {
                obj.objects[n] = new ValidForm($(obj.forms[n]).get(), {}, true);
            }
            return obj.objects[n];
        },
        resetStatus: function () {
            var obj = this;
            $(obj.forms).each(function () {
                this.validform_status = "normal";
            });

            return this;
        },
        setStatus: function (status) {
            var obj = this;
            $(obj.forms).each(function () {
                this.validform_status = status || "posting";
            });

            return this;
        },

        getStatus: function () {
            return $(this.forms)[0].validform_status;
        },

        ignore: function (selector0) {
            var obj = this;
            var selector = selector0 || "[datatype]";

            $(obj.forms).find(selector).each(function () {
                $(this).data("dataIgnore", "dataIgnore").removeClass("Validform_error");
            });

            return this;
        },

        unignore: function (selector0) {
            var obj = this;
            var selector = selector0 || "[datatype]";

            $(obj.forms).find(selector).each(function () {
                $(this).removeData("dataIgnore");
            });

            return this;
        },

        addRule: function (rule0) {
            /*
             rule => [{
             ele:"#id",
             datatype:"*",
             errormsg:"出错提示文字！",
             nullmsg:"为空时的提示文字！",
             tip:"默认显示的提示文字",
             altercss:"gray",
             ignore:"ignore",
             ajaxurl:"valid.php",
             recheck:"password",
             plugin:"passwordStrength"
             },{},{},...]
             */
            var obj = this, rule = rule0 || [], index, attr, o;
            for (index = 0; index < rule.length; index++) {
                o = $(obj.forms).find(rule[index].ele);
                for (attr in rule[index]) {
                    if (rule[index].hasOwnProperty(attr)) {
                        if (attr !== "ele") {
                            o.attr(attr, rule[index][attr]);
                        }
                    }
                }
            }

            $(obj.forms).each(function () {
                var $this = $(this);
                ValidForm.util.enhance.call($this, this.settings.tiptype, this.settings.usePlugin, this.settings.tipSweep, "addRule");
            });

            return this;
        },

        ajaxPost: function (flag, sync, url) {
            var obj = this;

            $(obj.forms).each(function () {
                var t = this;
                //创建pop box;
                if (t.settings.tiptype === 1 || t.settings.tiptype === 2 || t.settings.tiptype === 3) {
                    creatMsgbox();
                }
                ValidForm.util.submitForm.call($(obj.forms[0]), t.settings, flag, url, "ajaxPost", sync);
            });

            return this;
        },

        submitForm: function (flag, url) {
            /*flag===true时不做验证直接提交*/


            var obj = this;

            $(obj.forms).each(function () {
                var subflag = ValidForm.util.submitForm.call($(this), this.settings, flag, url);
                if (subflag === undef) {
                    subflag = true;
                }
                if (subflag === true) {
                    this.submit();
                }
            });

            return this;
        },

        resetForm: function () {
            var obj = this;
            ValidForm.util.resetForm.call($(obj.forms));

            return this;
        },

        abort: function () {
            var obj = this;
            $(obj.forms).each(function () {
                ValidForm.util.abort.call(this);
            });

            return this;
        },

        check: function (bool, selector1) {
            /*
             bool：传入true，只检测不显示提示信息;
             */
            var selector = selector1 || "[datatype]", obj = this, curform = $(obj.forms), flag = true;
            curform.find(selector).each(function () {
                var s = ValidForm.util.check.call(this, curform, "", bool);
                if (!s) {
                    flag = false;
                }
            });

            return flag;
        },

        config: function (setup) {
            var obj = this;
            setup = setup || {};
            $(obj.forms).each(function () {
                var $this = $(this);
                var this_settings = this.settings;
                this_settings = $.extend(true, this_settings, setup);
                ValidForm.util.enhance.call($this, this_settings.tiptype, this_settings.usePlugin, this_settings.tipSweep);
            });

            return this;
        }
    };

    $.fn.Validform = function (settings) {
        return new ValidForm(this, settings);
    };

    setCenter = function (obj, time) {
        var left, top;
        left = ($(window).width() - obj.outerWidth()) / 2;
        top = ($(window).height() - obj.outerHeight()) / 2;
        var scrollTop = document.documentElement.scrollTop;
        top = (scrollTop || document.body.scrollTop) + (top > 0 ? top : 0);
        obj.css({
            left: left
        }).animate({
            top: top
        }, {duration: time, queue: false});
    };


    //公用方法显示&关闭信息提示框;
    $.Showmsg = function (msg) {
        creatMsgbox();
        ValidForm.util.showmsg.call(win, msg, 1, {});
    };

    $.Hidemsg = function () {
        msgObj.hide();
        msgHidden = true;
    };

}(jQuery, window));
