import AppKit
import Foundation

enum CoverError: Error {
    case arguments
    case imageContext
    case encoding
}

struct CoverPalette {
    let title: String
    let finale: String
    let accent: NSColor
    let background: NSColor
}

func renderCover(palette: CoverPalette) throws -> Data {
    let width: Int = 1260
    let height: Int = 1000
    guard let bitmap: NSBitmapImageRep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
          let context: NSGraphicsContext = NSGraphicsContext(bitmapImageRep: bitmap) else { throw CoverError.imageContext }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    defer { NSGraphicsContext.restoreGraphicsState() }
    let accent: NSColor = palette.accent
    let background: NSColor = palette.background
    background.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: width, height: height)).fill()
    let grid: NSBezierPath = NSBezierPath()
    for x: Int in stride(from: 0, through: width, by: 50) { grid.move(to: NSPoint(x: x, y: 0)); grid.line(to: NSPoint(x: x, y: height)) }
    for y: Int in stride(from: 0, through: height, by: 50) { grid.move(to: NSPoint(x: 0, y: y)); grid.line(to: NSPoint(x: width, y: y)) }
    accent.withAlphaComponent(0.09).setStroke(); grid.lineWidth = 1; grid.stroke()
    let circle: NSBezierPath = NSBezierPath(ovalIn: NSRect(x: 760, y: 420, width: 390, height: 390))
    accent.withAlphaComponent(0.17).setStroke(); circle.lineWidth = 2; circle.stroke()
    let wave: NSBezierPath = NSBezierPath()
    wave.move(to: NSPoint(x: -30, y: 150)); wave.line(to: NSPoint(x: 180, y: 420)); wave.line(to: NSPoint(x: 360, y: 170)); wave.line(to: NSPoint(x: 570, y: 470)); wave.line(to: NSPoint(x: 780, y: 220)); wave.line(to: NSPoint(x: 1110, y: 640))
    let shadow: NSShadow = NSShadow(); shadow.shadowColor = accent; shadow.shadowBlurRadius = 28; shadow.shadowOffset = .zero
    NSGraphicsContext.saveGraphicsState(); shadow.set(); accent.setStroke(); wave.lineWidth = 7; wave.lineJoinStyle = .round; wave.stroke(); NSGraphicsContext.restoreGraphicsState()
    let arrow: NSBezierPath = NSBezierPath(); arrow.move(to: NSPoint(x: 1084, y: 614)); arrow.line(to: NSPoint(x: 1143, y: 676)); arrow.line(to: NSPoint(x: 1127, y: 596)); arrow.line(to: NSPoint(x: 1115, y: 628)); arrow.close(); accent.setFill(); arrow.fill()
    let main: String = palette.title
    let title: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 176, weight: .black), .foregroundColor: NSColor.white, .kern: -10]
    (main as NSString).draw(at: NSPoint(x: 75, y: 703), withAttributes: title)
    ("WAVE CHALLANGE" as NSString).draw(at: NSPoint(x: 86, y: 657), withAttributes: [.font: NSFont.systemFont(ofSize: 28, weight: .heavy), .foregroundColor: accent, .kern: 9])
    ("KAZAN. GELİŞ. İZ BIRAK." as NSString).draw(at: NSPoint(x: 88, y: 591), withAttributes: [.font: NSFont.systemFont(ofSize: 17, weight: .medium), .foregroundColor: NSColor.white.withAlphaComponent(0.6), .kern: 3])
    background.withAlphaComponent(0.92).setFill(); NSBezierPath(rect: NSRect(x: 0, y: 0, width: width, height: 155)).fill()
    ("2.500 PARKUR   /   2.500 MÜZİK   /   12 KARAKTER" as NSString).draw(at: NSPoint(x: 87, y: 89), withAttributes: [.font: NSFont.systemFont(ofSize: 20, weight: .bold), .foregroundColor: NSColor.white, .kern: 2])
    ("18 ANA PARKUR + 2.482 KEŞİF   ·   KARAKTERLERİ OYNAYARAK KAZAN" as NSString).draw(at: NSPoint(x: 88, y: 58), withAttributes: [.font: NSFont.systemFont(ofSize: 13, weight: .medium), .foregroundColor: NSColor.white.withAlphaComponent(0.65), .kern: 1.5])
    let finale: String = palette.finale
    (finale as NSString).draw(at: NSPoint(x: 88, y: 28), withAttributes: [.font: NSFont.systemFont(ofSize: 13, weight: .semibold), .foregroundColor: accent, .kern: 3])
    guard let png: Data = bitmap.representation(using: .png, properties: [:]) else { throw CoverError.encoding }
    return png
}

guard CommandLine.arguments.count == 3, ["red", "yellow"].contains(CommandLine.arguments[1]) else { throw CoverError.arguments }
let palettes: [String: CoverPalette] = [
    "red": CoverPalette(title: "KAN", finale: "ZİRVE: KAN GRIEF   /   VOLUME 03", accent: NSColor(red: 1, green: 0.23, blue: 0.34, alpha: 1), background: NSColor(red: 0.08, green: 0.025, blue: 0.05, alpha: 1)),
    "yellow": CoverPalette(title: "SARI", finale: "ZİRVE: SARI GRIEF   /   VOLUME 03", accent: NSColor(red: 1, green: 0.85, blue: 0.14, alpha: 1), background: NSColor(red: 0.05, green: 0.075, blue: 0.06, alpha: 1))
]
guard let palette: CoverPalette = palettes[CommandLine.arguments[1]] else { throw CoverError.arguments }
let png: Data = try renderCover(palette: palette)
try png.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
