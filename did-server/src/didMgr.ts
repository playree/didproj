import { DidManager, IonDidCreaterWithChallenge, IonDidResolver } from 'did-sdk'

export const didMgr = new DidManager(
  [new IonDidCreaterWithChallenge()],
  [new IonDidResolver()]
)
