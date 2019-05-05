  handleKeyboardEvent: (event, {replay, disabledBindings}={}) ->
    # Handling keyboard events is complicated and very nuanced. The complexity
    # is all due to supporting multi-stroke bindings. An example binding we'll
    # use throughout this very long comment:
    #
    # 'ctrl-a b c': 'my-sweet-command' // This is a binding
    #
    # This example means the user can type `ctrl-a` then `b` then `c`, and after
    # all of those keys are typed, it will dispatch the `my-sweet-command`
    # command.
    #
    # The KeymapManager has a couple member variables to deal with multi-stroke
    # bindings: `@queuedKeystrokes` and `@queuedKeyboardEvents`. They keep track
    # of the keystrokes the user has typed. When populated, the state variables
    # look something like:
    #
    # @queuedKeystrokes = ['ctrl-a', 'b', 'c']
    # @queuedKeyboardEvents = [KeyboardEvent, KeyboardEvent, KeyboardEvent]
    #
    # Basically, this `handleKeyboardEvent` function will try to exactly match
    # the user's keystrokes to a binding. If it cant match exactly, it looks for
    # partial matches. So say, a user typed `ctrl-a` then `b`, but not `c` yet.
    # The `ctrl-a b c` binding would be partially matched:
    #
    # // The original binding: 'ctrl-a b c': 'my-sweet-command'
    # @queuedKeystrokes = ['ctrl-a', 'b'] // The user's keystrokes
    # @queuedKeyboardEvents = [KeyboardEvent, KeyboardEvent]
    #
    # When it finds partially matching bindings, it will put the KeymapManager
    # into a pending state via `enterPendingState` indicating that it is waiting
    # for either a timeout or more keystrokes to exactly match the partial
    # matches. In our example, it is waiting for the user to type `c` to
    # complete the partially matched `ctrl-a b c` binding.
    #
    # If a keystroke comes in that either matches a binding exactly, or yields
    # no partial matches, we will reset the state variables and exit pending
    # mode. If the keystroke yields no partial matches we will call
    # `terminatePendingState`. An extension of our last example:
    #
    # // Both of these will exit pending state for: 'ctrl-a b c': 'my-sweet-command'
    # @queuedKeystrokes = ['ctrl-a', 'b', 'c'] // User typed `c`. Exact match! Dispatch the command and clear state variables. Easy.
    # @queuedKeystrokes = ['ctrl-a', 'b', 'd'] // User typed `d`. No hope of matching, terminatePendingState(). Dragons.
    #
    # `terminatePendingState` is where things get crazy. Let's pretend the user
    # typed 3 total keystrokes: `ctrl-a`, `b`, then `d`. There are no exact
    # matches with these keystrokes given the original `'ctrl-a b c'` binding,
    # but other bindings might match a subset of the user's typed keystrokes.
    # Let's pretend we had more bindings defined:
    #
    # // The original binding; no match for ['ctrl-a', 'b', 'd']:
    # 'ctrl-a b c': 'my-sweet-command'
    #
    # // Bindings that all match a subset of ['ctrl-a', 'b', 'd']:
    # 'ctrl-a': 'ctrl-a-command'
    # 'b d': 'do-a-bd-deal'
    # 'd o g': 'wag-the-dog'
    #
    # With these example bindings, and the user's `['ctrl-a', 'b', 'd']`
    # keystrokes, we should dispatch commands `ctrl-a-command` and
    # `do-a-bd-deal`.
    #
    # After `['ctrl-a', 'b', 'd']` is typed by the user, `terminatePendingState`
    # is called, which will _disable_ the original unmatched `ctrl-a b c`
    # binding, empty the keystroke state variables, and _replay_ the key events
    # by running them through this `handleKeyboardEvent` function again. The
    # replay acts exactly as if a user were typing the keys, but with a disabled
    # binding. Because the original binding is disabled, the replayed keystrokes
    # will match other, shorter bindings, and in this case, dispatch commands
    # for our `ctrl-a` and then our `b d` bindings.
    #
    # Because the replay is calling this `handleKeyboardEvent` function again,
    # it can get into another pending state, and again call
    # `terminatePendingState`. The 2nd call to `terminatePendingState` might
    # disable other bindings, and do another replay, which might call this
    # function again ... and on and on. It will recurse until the KeymapManager
    # is no longer in a pending state with no partial matches from the most
    # recent event.
    #
    # Godspeed.

    # When a keyboard event is part of IME composition, the keyCode is always
    # 229, which is the "composition key code". This API is deprecated, but this
    # is the most simple and reliable way we found to ignore keystrokes that are
    # part of IME compositions.
    if event.keyCode is 229 and event.key isnt 'Dead'
      return

    # keystroke is the atom keybind syntax, e.g. 'ctrl-a'
    keystroke = @keystrokeForKeyboardEvent(event)

    # We dont care about bare modifier keys in the bindings. e.g. `ctrl y` isnt going to work.
    if event.type is 'keydown' and @queuedKeystrokes.length > 0 and isBareModifier(keystroke)
      event.preventDefault()
      return

    @queuedKeystrokes.push(keystroke)
    @queuedKeyboardEvents.push(event)
    keystrokes = @queuedKeystrokes.join(' ')

    # If the event's target is document.body, assign it to defaultTarget instead
    # to provide a catch-all element when nothing is focused.
    target = event.target
    target = @defaultTarget if event.target is document.body and @defaultTarget?

    # First screen for any bindings that match the current keystrokes,
    # regardless of their current selector. Matching strings is cheaper than
    # matching selectors.
    {partialMatchCandidates, pendingKeyupMatchCandidates, exactMatchCandidates} = @findMatchCandidates(@queuedKeystrokes, disabledBindings)
    dispatchedExactMatch = null
    partialMatches = @findPartialMatches(partialMatchCandidates, target)

    # If any partial match *was* pending but has now failed to match, add it to
    # the list of bindings to disable so we don't attempt to match it again
    # during a subsequent event replay by `terminatePendingState`.
    if @pendingPartialMatches?
      liveMatches = new Set(partialMatches.concat(exactMatchCandidates))
      for binding in @pendingPartialMatches
        @bindingsToDisable.push(binding) unless liveMatches.has(binding)

    hasPartialMatches = partialMatches.length > 0
    shouldUsePartialMatches = hasPartialMatches

    if isKeyup(keystroke)
      exactMatchCandidates = exactMatchCandidates.concat(@pendingKeyupMatcher.getMatches(keystroke))

    # Determine if the current keystrokes match any bindings *exactly*. If we
    # do find an exact match, the next step depends on whether we have any
    # partial matches. If we have no partial matches, we dispatch the command
    # immediately. Otherwise we break and allow ourselves to enter the pending
    # state with a timeout.
    if exactMatchCandidates.length > 0
      currentTarget = target
      eventHandled = false
      while not eventHandled and currentTarget? and currentTarget isnt document
        exactMatches = @findExactMatches(exactMatchCandidates, currentTarget)
        for exactMatchCandidate in exactMatches
          if exactMatchCandidate.command is 'native!'
            shouldUsePartialMatches = false
            # `break` breaks out of this loop, `eventHandled = true` breaks out of the parent loop
            eventHandled = true
            break

          if exactMatchCandidate.command is 'abort!'
            event.preventDefault()
            eventHandled = true
            break

          if exactMatchCandidate.command is 'unset!'
            break

          if hasPartialMatches
            # When there is a set of bindings like `'ctrl-y', 'ctrl-y ^ctrl'`,
            # and a `ctrl-y` comes in, this will allow the `ctrl-y` command to be
            # dispatched without waiting for any other keystrokes.
            allPartialMatchesContainKeyupRemainder = true
            for partialMatch in partialMatches
              if pendingKeyupMatchCandidates.indexOf(partialMatch) < 0
                allPartialMatchesContainKeyupRemainder = false
                # We found one partial match with unmatched keydowns.
                # We can stop looking.
                break
            # Don't dispatch this exact match. There are partial matches left
            # that have keydowns.
            break if allPartialMatchesContainKeyupRemainder is false
          else
            shouldUsePartialMatches = false

          if @dispatchCommandEvent(exactMatchCandidate.command, target, event)
            dispatchedExactMatch = exactMatchCandidate
            eventHandled = true
            for pendingKeyupMatch in pendingKeyupMatchCandidates
              @pendingKeyupMatcher.addPendingMatch(pendingKeyupMatch)
            break
        currentTarget = currentTarget.parentElement

    # Emit events. These are done on their own for clarity.

    if dispatchedExactMatch?
      @emitter.emit 'did-match-binding', {
        keystrokes,
        eventType: event.type,
        binding: dispatchedExactMatch,
        keyboardEventTarget: target
      }
    else if hasPartialMatches and shouldUsePartialMatches
      event.preventDefault()
      @emitter.emit 'did-partially-match-binding', {
        keystrokes,
        eventType: event.type,
        partiallyMatchedBindings: partialMatches,
        keyboardEventTarget: target
      }
    else if not dispatchedExactMatch? and not hasPartialMatches
      @emitter.emit 'did-fail-to-match-binding', {
        keystrokes,
        eventType: event.type,
        keyboardEventTarget: target
      }
      # Some of the queued keyboard events might have inserted characters had
      # we not prevented their default action. If we're replaying a keystroke
      # whose default action was prevented and no binding is matched, we'll
      # simulate the text input event that was previously prevented to insert
      # the missing characters.
      @simulateTextInput(event) if event.defaultPrevented and event.type is 'keydown'

    # Manage the keystroke queue state. State is updated separately for clarity.

    @bindingsToDisable.push(dispatchedExactMatch) if dispatchedExactMatch
    if hasPartialMatches and shouldUsePartialMatches
      enableTimeout = (
        @pendingStateTimeoutHandle? or
        exactMatchCandidate? or
        characterForKeyboardEvent(@queuedKeyboardEvents[0])?
      )
      enableTimeout = false if replay
      @enterPendingState(partialMatches, enableTimeout)
    else if not dispatchedExactMatch? and not hasPartialMatches and @pendingPartialMatches?
      # There are partial matches from a previous event, but none from this
      # event. This means the current event has removed any hope that the queued
      # key events will ever match any binding. So we will clear the state and
      # start over after replaying the events in `terminatePendingState`.
      @terminatePendingState()
    else
      @clearQueuedKeystrokes()

   isKeyup = (keystroke) -> keystroke.startsWith('^') and keystroke isnt '^'

  findMatchCandidates: (keystrokeArray, disabledBindings) ->
    partialMatchCandidates = []
    exactMatchCandidates = []
    pendingKeyupMatchCandidates = []
    disabledBindingSet = new Set(disabledBindings)

    for binding in @keyBindings when not disabledBindingSet.has(binding)
      doesMatch = binding.matchesKeystrokes(keystrokeArray)
      if doesMatch is MATCH_TYPES.EXACT
        exactMatchCandidates.push(binding)
      else if doesMatch is MATCH_TYPES.PARTIAL
        partialMatchCandidates.push(binding)
      else if doesMatch is MATCH_TYPES.PENDING_KEYUP
        partialMatchCandidates.push(binding)
        pendingKeyupMatchCandidates.push(binding)
    {partialMatchCandidates, pendingKeyupMatchCandidates, exactMatchCandidates}

  matchesKeystrokes: (userKeystrokes) ->
    userKeystrokeIndex = -1
    userKeystrokesHasKeydownEvent = false
    matchesNextUserKeystroke = (bindingKeystroke) ->
      while userKeystrokeIndex < userKeystrokes.length - 1
        userKeystrokeIndex += 1
        userKeystroke = userKeystrokes[userKeystrokeIndex]
        isKeydownEvent = not isKeyup(userKeystroke)
        userKeystrokesHasKeydownEvent = true if isKeydownEvent
        if bindingKeystroke is userKeystroke
          return true
        else if isKeydownEvent
          return false
      null
