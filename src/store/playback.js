import Vue from 'vue'
import {
  TRACK_LENGTH,
  MAX_TRACKS,
  NOTE_FREQUENCIES,
  NULL_NOTE,

  BPM2ms ,
  initTrack
} from '../lib.helpers.js'
import {
  playNote,
  createOscillator,
  OSC_TYPES
} from '../lib.audio.js'

const playback = {
  state:{
    isPlaying: false,
    iterator: 0,
    BPM: 120,

    tracks: [],
    trackNameIterator: 0,
    openedOptions: null,

    openedVK: null
  },

  mutations:{
    Play(state){
      state.isPlaying = true

      state.tracks.forEach(x => {
        const n = x.notes[state.iterator]

        if(n.note != '-' && n.note != '#'){
          const osc = createOscillator(x.oscType, n.volume)
          playNote(osc, NOTE_FREQUENCIES[n.note] * Math.pow(2, n.octave))
        }
      })

      state.iterator = (state.iterator < TRACK_LENGTH - 1) ? state.iterator + 1 : 0
    },

    Pause(state){
      state.isPlaying = false

      window.clearInterval(window.playbackInterval)
    },

    Stop(state){
      state.isPlaying = false
      state.iterator = 0

      window.clearInterval(window.playbackInterval)
    },

    addTrack(state){
      state.trackNameIterator++

      if(state.tracks.length < MAX_TRACKS){
        state.tracks.push({
          notes: initTrack(),
          name: 'Track ' + state.trackNameIterator,
          bgColor: '#000',
          oscType: OSC_TYPES[0]
        })
      }
    },

    deleteTrack(state, i){
      state.tracks.splice(i, 1)
    },

    openTrackOptions(state, trackId){
      state.openedOptions = trackId
    },

    closeTrackOptions(state, e){
      if(e.target.className == 'global-overlay')
        state.openedOptions = null
    },

    closeTrackOptionsESC(state){
      state.openedOptions = null
    },

    openVirtualKeyboard(state, payload){
      state.openedVK = payload
    },

    closeVirtualKeyboard(state, e){
      if(e.target.className == 'global-overlay')
        state.openedVK = null
    },

    closeVirtualKeyboardESC(state){
      state.openedVK = null
    },

    setTrackColor(state, col){
      state.tracks[state.openedOptions].bgColor = col
    },

    setTrackName(state, n){
      state.tracks[state.openedOptions].name = n
    },

    setTrackOsc(state, t){
      state.tracks[state.openedOptions].oscType = t
    },

    incrementVolume(state, {track, offset, inc}){
      const curVol = state.tracks[track].notes[offset].volume
      let newVol

      if(inc > 0){
        if((curVol + inc) >= 100)
          newVol = 100
        else
          newVol = curVol + inc
      }
      else{
        if((curVol + inc) <= 0)
          newVol = 0
        else
          newVol = curVol + inc
      }

      state.tracks[track].notes[offset].volume = newVol
    },

    insertNote(state, note){
      const {track, offset} = state.openedVK

      // Triggers a rerender (nested object)
      Vue.set(state.tracks[track].notes, offset, {
        ...state.tracks[track].notes[offset],
        note
      })

      state.openedVK = null
    },

    removeNote(state, {track, offset}){
      Vue.set(state.tracks[track].notes, offset, NULL_NOTE)
    },

    changeOctave(state, increment){
      let nextOctave = this.getters.currentOctave + increment

      if(nextOctave >= 8 && increment === 1)
        return
      else if(nextOctave === 0 && increment === -1)
        return

      const {track, offset} = state.openedVK
      Vue.set(state.tracks[track].notes, offset, {
        ...state.tracks[track].notes[offset],
        octave: nextOctave
      })
    },

    setBPM(state, BPM){
      BPM = BPM > 300 ? 300 : BPM < 50 ? 50 : BPM
      state.BPM = BPM
    }
  },

  actions:{
    Play({state, commit, rootState}){
      window.playbackInterval = window.setInterval(() => commit('Play'), BPM2ms(this.getters.BPM))

      commit('Play')
    },

    Pause({commit}){ commit('Pause') },

    Stop({commit}){ commit('Stop') },

    addTrack({commit}){ commit('addTrack') },

    deleteTrack({commit}, i){ commit('deleteTrack', i) },

    setTrackColor({commit}, col){ commit('setTrackColor', col) },

    setTrackName({commit}, e){ commit('setTrackName', e.target.value) },

    setTrackOsc({commit}, t){ commit('setTrackOsc', t) },

    incrementVolume({commit}, [event, track, offset]){
      event.preventDefault()

      commit('incrementVolume', {
        track,
        offset,
        inc: 5
      })
    },

    decrementVolume({commit}, [event, track, offset]){
      event.preventDefault()

      commit('incrementVolume', {
        track,
        offset,
        inc: -5
      })
    },

    openTrackOptions({commit}, trackId){ commit('openTrackOptions', trackId) },

    closeTrackOptions({commit}, e){ commit('closeTrackOptions', e) },

    closeTrackOptionsESC({commit}){ commit('closeTrackOptionsESC') },

    openVirtualKeyboard({commit}, [track, offset]){
      commit('openVirtualKeyboard', {track, offset})
    },

    closeVirtualKeyboard({commit}, e){ commit('closeVirtualKeyboard', e) },

    closeVirtualKeyboardESC({commit}){ commit('closeVirtualKeyboardESC') },

    insertNote({commit}, note){
      commit('insertNote', note)
    },

    removeNote({commit}, [event, track, offset]){
      event.preventDefault()

      commit('removeNote', {track, offset})
    },

    lowerOctave({commit}){
      commit('changeOctave', -1)
    },

    upperOctave({commit}){
      commit('changeOctave', 1)
    },

    setBPM({commit}, BPM){
      commit('setBPM', BPM)
    }
  },

  getters:{
    BPM(state){
      return state.BPM
    },

    currentOctave(state){
      const {track, offset} = state.openedVK

      return state.tracks[track].notes[offset].octave
    }
  }
}

export default playback
