class Monotron
  constructor: (@context) ->
    @vco = @context.createOscillator()
    @lfo = @context.createOscillator()
    @lfoGain = @context.createGain()
    @vcf = @context.createBiquadFilter()
    @output = @context.createGain()

    @vco.connect @vcf
    @lfo.connect @lfoGain
    @lfoGain.connect @vcf.frequency
    @vcf.connect @output

    @output.gain.value = 0
    @vco.type = @vco.SAWTOOTH
    @lfo.type = @lfo.SAWTOOTH
    @vco.start @context.currentTime
    @lfo.start @context.currentTime

    # the initial "patch"
    @lfo.frequency.value = 2.2
    @lfoGain.gain.value = 100
    @vcf.frequency.value = 240
    @vcf.Q.value = 50

  noteOn: (frequency, time) ->
    time ?= @context.currentTime
    @vco.frequency.setValueAtTime frequency, time
    @output.gain.linearRampToValueAtTime 1.0, time + 0.05

  noteOff: (time) ->
    time ?= @context.currentTime
    @output.gain.linearRampToValueAtTime 0.0, time + 0.05

  connect: (target) ->
    @output.connect target

class RibbonKeyboard
  constructor: (@$el) ->
    $ul = $('<ul>')
    for note in [1..18]
      $key = $('<li>')
      if note in [2, 5, 7, 10, 12, 14, 17]
        $key.addClass 'accidental'
        $key.width (@$el.width() / 20)
        $key.css 'left', "-#{$key.width() / 2}px"
        $key.css 'margin-right', "-#{$key.width()}px"
      else if note in [1, 18]
        $key.width (@$el.width() / 20)
      else
        $key.width (@$el.width() / 10)
      $ul.append $key
    @$el.append $ul

$ ->
  audioContext = new webkitAudioContext()
  window.monotron = new Monotron(audioContext)
  monotron.connect audioContext.destination

  $('.knob input').each (i, knob) ->
    new Knob(knob, new Ui.P2())
  keyboard = new RibbonKeyboard($('#keyboard'))
