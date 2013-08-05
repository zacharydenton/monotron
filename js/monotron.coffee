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

  noteOn: (frequency, time) ->
    time ?= @context.currentTime
    @vco.frequency.setValueAtTime frequency, time
    @output.gain.linearRampToValueAtTime 1.0, time + 0.1

  noteOff: (time) ->
    time ?= @context.currentTime
    @output.gain.linearRampToValueAtTime 0.0, time + 0.1

  connect: (target) ->
    @output.connect target

class RibbonKeyboard
  constructor: (@$el, @monotron) ->
    @minNote = 57
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

    @mouseDown = false
    $ul.mousedown (e) =>
      @mouseDown = true
      @click(e)
    $ul.mouseup (e) =>
      @mouseDown = false
      @monotron.noteOff()
    $ul.mousemove @click

  click: (e) =>
    return unless @mouseDown
    offset =  e.pageX - @$el.offset().left
    ratio = offset / @$el.width()
    min = noteToFrequency @minNote
    max = noteToFrequency (@minNote + 18)
    @monotron.noteOn ratio * (max - min) + min

noteToFrequency = (note) ->
  Math.pow(2, (note - 69) / 12) * 440.0

$ ->
  audioContext = new (AudioContext ? webkitAudioContext)()
  window.monotron = new Monotron(audioContext)
  masterGain = audioContext.createGain()
  masterGain.gain.value = 0.7 # to prevent clipping
  masterGain.connect audioContext.destination
  monotron.connect masterGain

  keyboard = new RibbonKeyboard($('#keyboard'), monotron)

  params =
    rate:
      param: monotron.lfo.frequency
      min: 0.001
      max: 900.0
      scale: 1.1
    int:
      param: monotron.lfoGain.gain
      min: 0.5
      max: 500.0
    cutoff:
      param: monotron.vcf.frequency
      min: 0.001
      max: 900.0
      scale: 1.03
    peak:
      param: monotron.vcf.Q
      min: 0.001
      max: 1000.0
      scale: 1.10

  knopfs = []
  $('.knob input').each (i, knob) ->
    knopf = new Knob(knob, new Ui.P2())
    knopfs.push knopf
    param = params[knob.id]
    if param?
      knopf.changed = ->
        Knob.prototype.changed.apply this, arguments
        # convert to log scale
        scale = param.scale ? 1.05
        ratio = Math.pow(scale, @value) / Math.pow(scale, @settings.max)
        value = ratio * (param.max - param.min) + param.min
        param.param.setValueAtTime value, audioContext.currentTime
    else if knob.id == "pitch"
      knopf.changed = ->
        Knob.prototype.changed.apply this, arguments
        keyboard.minNote = parseInt @value

  $('#mod').change (e) ->
    target = $(this).find(":selected").val()
    monotron.lfoGain.disconnect()
    if target is "Pitch"
      monotron.lfoGain.connect monotron.vco.frequency
    else if target is "Cutoff"
      monotron.lfoGain.connect monotron.vcf.frequency

  # the initial "patch"
  $("#pitch").val 57
  $("#rate").val 46
  $("#int").val 97
  $("#cutoff").val 72
  $("#peak").val 57
  $("#mod").val "Pitch"

  # play note based on keyboard's keyCodes
  playNote = (code) ->
    # change this string to match qwerty layout to notes
    notes = '1234567890qwertyuiopasdfghjklzxcvbnm'
    note = notes.indexOf(String.fromCharCode(code).toLowerCase()) % 18
    if note < 0 then note = code % 18
    monotron.noteOn noteToFrequency 57 + note

  # handle key press events
  pressed = []
  $(window).keydown (e) ->
    code = e.keyCode
    if pressed.indexOf(code) == -1 then pressed.push code
    playNote code
  $(window).keyup (e) ->
    code = e.keyCode
    if pressed.indexOf(code) >= 0 then pressed.splice(pressed.indexOf(code), 1)
    if pressed.length < 1 then monotron.noteOff() else playNote pressed[pressed.length - 1]

  knopfs.forEach (knopf) ->
    knopf.changed 0
