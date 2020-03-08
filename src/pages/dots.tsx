import { AxisBottom } from '@vx/axis'
import { Group } from '@vx/group'
import { Marker } from '@vx/marker'
import { withParentSize } from '@vx/responsive'
import { scaleLinear } from '@vx/scale'
import { Circle } from '@vx/shape'
import { Text } from '@vx/text'
import React from 'react'

// const points = genRandomNormalPoints(10).filter((d, i) => {
//   return i < 10
// })

// const x = (d: any) => d[0]
// const y = (d: any) => d[1]
// const z = (d: any) => d[2]

// let tooltipTimeout: any

const average = (arr: number[]) =>
  arr.reduce((p: number, c: number) => p + c, 0) / arr.length

export default withParentSize((props: any) => {
  const { maxWidth, height } = props
  const width: number =
    props.parentWidth > maxWidth ? props.maxWidth : props.parentWidth
  console.log('> width', width)

  const xMax = width
  // const yMax = height

  const xScale = scaleLinear({
    domain: [0, 10],
    range: [0, xMax],
    clamp: true,
  })
  // console.log(xScale.ticks())
  // const yScale = scaleLinear({
  //   domain: [0.75, 1.6],
  //   range: [yMax, 0],
  //   clamp: true,
  // })

  // console.log(props)

  const purple3 = 'rgba(64, 64, 64, 0.6)'
  const formatTick = (tick: number) => tick
  const avg = average(props.points)
  // console.log('> props.points', props.points)
  // console.log('> avg', avg)
  // console.log('> props', props)

  return (
    <svg width={width * 1.5} height={height}>
      {/* <GradientPinkRed id="pink" /> */}
      <rect width={width} height={height} fill={'rgba(64, 64, 64, 0)'} />
      <Group>
        {props.points.map((point: any, i: any) => {
          // const cx = xScale(x(point))
          const cx = xScale(point)
          // console.log(point, cx)
          // const cx = point
          // console.log(point, x(point), cx)
          // const cy = yScale(y(point))
          // console.log(point, cy)
          const cy = height * 0.3
          // const r = i % 3 === 0 ? 2 : 2.765
          const r = 3

          return (
            <Circle
              key={`point-${i}`}
              className="dot"
              cx={cx}
              cy={cy}
              r={r}
              fill="rgba(246, 196, 49, 0.5)"
            />
          )
        })}
      </Group>
      <Text
        verticalAnchor="start"
        style={{
          fontSize: 11,
          fill: 'rgba(64, 64, 64, 0.6)',
        }}
      >{`n = ${props.points.length}`}</Text>
      <Marker
        from={{ x: xScale(avg), y: 0 }}
        to={{ x: xScale(avg), y: height * 0.15 }}
        stroke={'rgba(64, 64, 64, 0.4'}
        strokeWidth={1.5}
        label={`avg = ${avg.toFixed(2)}`}
        labelFill={'rgba(64, 64, 64, 0.6)'}
        labelStroke={'none'}
        labelDx={6}
        labelDy={10}
      />
      <AxisBottom
        top={height * 0.6}
        scale={xScale}
        tickFormat={formatTick}
        stroke={purple3}
        tickStroke={purple3}
        tickLength={4}
        hideZero={false}
        tickLabelProps={(value: any, index: any) => ({
          fill: purple3,
          fontSize: 11,
          textAnchor: 'middle',
          // transform: 'translate(0, 1)',
        })}
      />
    </svg>
  )
})
