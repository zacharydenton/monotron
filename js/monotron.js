(function() {
  var Monotron, RibbonKeyboard, noteToFrequency,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Monotron = (function() {
    function Monotron(context) {
      this.context = context;
      this.vco = this.context.createOscillator();
      this.lfo = this.context.createOscillator();
      this.lfoGain = this.context.createGain();
      this.vcf = this.context.createBiquadFilter();
      this.output = this.context.createGain();
      this.vco.connect(this.vcf);
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.vcf.frequency);
      this.vcf.connect(this.output);
      this.output.gain.value = 0;
      this.vco.type = this.vco.SAWTOOTH;
      this.lfo.type = this.lfo.SAWTOOTH;
      this.vco.start(this.context.currentTime);
      this.lfo.start(this.context.currentTime);
    }

    Monotron.prototype.noteOn = function(frequency, time) {
      if (time == null) {
        time = this.context.currentTime;
      }
      this.vco.frequency.setValueAtTime(frequency, time);
      return this.output.gain.linearRampToValueAtTime(1.0, time + 0.05);
    };

    Monotron.prototype.noteOff = function(time) {
      if (time == null) {
        time = this.context.currentTime;
      }
      return this.output.gain.linearRampToValueAtTime(0.0, time + 0.05);
    };

    Monotron.prototype.connect = function(target) {
      return this.output.connect(target);
    };

    return Monotron;

  })();

  RibbonKeyboard = (function() {
    function RibbonKeyboard($el, monotron) {
      var $key, $ul, note, _i,
        _this = this;
      this.$el = $el;
      this.monotron = monotron;
      this.click = __bind(this.click, this);
      this.minNote = 57;
      $ul = $('<ul>');
      for (note = _i = 1; _i <= 18; note = ++_i) {
        $key = $('<li>');
        if (note === 2 || note === 5 || note === 7 || note === 10 || note === 12 || note === 14 || note === 17) {
          $key.addClass('accidental');
          $key.width(this.$el.width() / 20);
          $key.css('left', "-" + ($key.width() / 2) + "px");
          $key.css('margin-right', "-" + ($key.width()) + "px");
        } else if (note === 1 || note === 18) {
          $key.width(this.$el.width() / 20);
        } else {
          $key.width(this.$el.width() / 10);
        }
        $ul.append($key);
      }
      this.$el.append($ul);
      this.mouseDown = false;
      $ul.mousedown(function(e) {
        _this.mouseDown = true;
        return _this.click(e);
      });
      $ul.mouseup(function(e) {
        _this.mouseDown = false;
        return _this.monotron.noteOff();
      });
      $ul.mousemove(this.click);
    }

    RibbonKeyboard.prototype.click = function(e) {
      var max, min, offset, ratio;
      if (!this.mouseDown) {
        return;
      }
      offset = e.pageX - this.$el.offset().left;
      ratio = offset / this.$el.width();
      min = noteToFrequency(this.minNote);
      max = noteToFrequency(this.minNote + 18);
      return this.monotron.noteOn(ratio * (max - min) + min);
    };

    return RibbonKeyboard;

  })();

  noteToFrequency = function(note) {
    return Math.pow(2, (note - 69) / 12) * 440.0;
  };

  $(function() {
    var audioContext, keyboard, knopfs, params;
    audioContext = new webkitAudioContext();
    window.monotron = new Monotron(audioContext);
    monotron.connect(audioContext.destination);
    keyboard = new RibbonKeyboard($('#keyboard'), monotron);
    params = {
      rate: {
        param: monotron.lfo.frequency,
        min: 0.001,
        max: 900.0,
        scale: 1.1
      },
      int: {
        param: monotron.lfoGain.gain,
        min: 0.5,
        max: 500.0
      },
      cutoff: {
        param: monotron.vcf.frequency,
        min: 0.001,
        max: 900.0,
        scale: 1.03
      },
      peak: {
        param: monotron.vcf.Q,
        min: 0.001,
        max: 1000.0,
        scale: 1.10
      }
    };
    knopfs = [];
    $('.knob input').each(function(i, knob) {
      var knopf, param;
      knopf = new Knob(knob, new Ui.P2());
      knopfs.push(knopf);
      param = params[knob.id];
      if (param != null) {
        return knopf.changed = function() {
          var ratio, scale, value, _ref;
          Knob.prototype.changed.apply(this, arguments);
          scale = (_ref = param.scale) != null ? _ref : 1.05;
          ratio = Math.pow(scale, this.value) / Math.pow(scale, this.settings.max);
          value = ratio * (param.max - param.min) + param.min;
          return param.param.setValueAtTime(value, audioContext.currentTime);
        };
      } else if (knob.id === "pitch") {
        return knopf.changed = function() {
          Knob.prototype.changed.apply(this, arguments);
          return keyboard.minNote = parseInt(this.value);
        };
      }
    });
    $('#mod').change(function(e) {
      var target;
      target = $(this).find(":selected").val();
      monotron.lfoGain.disconnect();
      if (target === "Pitch") {
        return monotron.lfoGain.connect(monotron.vco.frequency);
      } else if (target === "Cutoff") {
        return monotron.lfoGain.connect(monotron.vcf.frequency);
      }
    });
    $("#pitch").val(57);
    $("#rate").val(48);
    $("#int").val(60);
    $("#cutoff").val(44);
    $("#peak").val(68);
    $("#mod").val("Cutoff");
    return knopfs.forEach(function(knopf) {
      return knopf.changed(0);
    });
  });

}).call(this);
