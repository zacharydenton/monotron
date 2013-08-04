(function() {
  var Monotron, RibbonKeyboard;

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
      this.lfo.frequency.value = 2.2;
      this.lfoGain.gain.value = 100;
      this.vcf.frequency.value = 240;
      this.vcf.Q.value = 50;
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
    function RibbonKeyboard($el) {
      var $key, $ul, note, _i;
      this.$el = $el;
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
    }

    return RibbonKeyboard;

  })();

  $(function() {
    var audioContext, keyboard;
    audioContext = new webkitAudioContext();
    window.monotron = new Monotron(audioContext);
    monotron.connect(audioContext.destination);
    $('.knob input').each(function(i, knob) {
      return new Knob(knob, new Ui.P2());
    });
    return keyboard = new RibbonKeyboard($('#keyboard'));
  });

}).call(this);
