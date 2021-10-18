import Rapier from '../rapier2d-node/dist/rapier.js'

// create world and event queue
const world = new Rapier.World({ x: 0, y: 0 })
const events = new Rapier.EventQueue(true)

// create two entities on a collision course
const e1 = makeEntity(-1, 0, 1, 0, 0.5)
const e2 = makeEntity(1, 0, -1, 0, 0.5)

// simulate 1 second
for (let i = 0; i < 60; i++) {
  world.step(events)

  events.drainIntersectionEvents((handle1, handle2, intersecting) => {
    console.log(
      `Intersect between: ${handle1} and ${handle2}. Intersecting: ${intersecting}`,
    )
  })

  events.drainContactEvents((handle1, handle2, contactStarted) => {
    console.log(
      `Contact between: ${handle1} and ${handle2}. Started: ${contactStarted}`,
    )
  })

  const t1 = e1.translation()
  const t2 = e2.translation()
  console.log(
    `(${t1.x.toFixed(3)},${t1.y.toFixed(3)}) (${t2.x.toFixed(3)},${t2.y.toFixed(
      3,
    )})`,
  )
}

console.log('Simulation done.')

// util function to make an rigid body entity with a circle collider
function makeEntity(x, y, vx, vy, r) {
  const bodyDesc = new Rapier.RigidBodyDesc(Rapier.RigidBodyType.Dynamic)
  bodyDesc.setTranslation(x, y)

  const body = world.createRigidBody(bodyDesc)
  const shape = new Rapier.Ball(r)
  const colliderDesc = new Rapier.ColliderDesc(shape)

  world.createCollider(colliderDesc, body.handle)
  body.applyImpulse({ x: vx, y: vy }, true)
  return body
}
