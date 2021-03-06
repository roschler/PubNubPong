// ATI: Note, the available area for bricks between the two paddles consists of 11 rows and 33 columnts.

// ATI: Added new brick color to represent the bricks that are unbreakable.
var gUnBreakableBrickColor = 0x8C001A;

var colorSchemes = {
    giantGoldfish       : [0x69D2E7, 0xA7DBD8, 0xE0E4CC, 0xF38630, 0xFA6900, gUnBreakableBrickColor],
    melonBallSurprise   : [0xD1F2A5, 0xEFFAB4, 0xFFC48C, 0xFF9F80, 0xF56991, gUnBreakableBrickColor],
    happy               : [0xFE4365, 0xFC9D9A, 0xF9CDAD, 0xC8C8A9, 0x83AF9B, gUnBreakableBrickColor],
},
	levels = [
	{
		brickTypes: {
			a : 0xFF4040,	// aqua
			b : 0xFF9640,	// pink
			c : 0x33CCCC,	// purple
			d : 0x3339E639	// purple
		},
		levelDesign: [
			"",
			"",
			"aaaaaaaaaaaaaaaaaaaa ",
			" aaacaabbbababcccaaa ",
			"    cccbbbababcccaaa ",
			"",
			"acccbbbaaaAcccbbbaaac",
			"abcabcabcabcabcabcabc",
			" bca ca ca ca ca cab ",
			"  cabcabcabcabcabca  "
		]
	},
	{
		brickTypes: {
			a : 0xFF4040,	// aqua
			b : 0xFF9640,	// pink
			c : 0x33CCCC,	// purple
			d : 0x3339E639	// purple
		},
		levelDesign: [
			"",
			"",
			"   aca  abdb  ccc aa ",
			"    dd bb ab bc cd a ",
			"",
			"a ccb ba  dc  bdb  ac",
			"ab d cab add  ca cdbc",
		]
	},
	{
		brickTypes: {
			a : colorSchemes.giantGoldfish[0],
			b : colorSchemes.giantGoldfish[4],
			c : colorSchemes.giantGoldfish[2],
			d : colorSchemes.giantGoldfish[1],
			e : colorSchemes.giantGoldfish[3]
		},
		levelDesign: [
			"",
			"",
			"   a   c bcd ba    da  a    ",
			"   c   a a   e c  e    b    ",
			"   b   c ea  cD   c bD c    ",
			"   d a e c   a b  d  a d    ",
			"    e b  eab de    ec  eab  ",
			"",
			"dc  adc a d  ed  cab ae  bB  d a ",
			"a e e   b e  b a b   e b a e e b ",
			"c a dc  c a  a e ab  ca  cb  a c ",
			"a c a   d c  e b d   a e d a  d  ",
			"de  ebd  e   ca  eac d c bc   e  ",
		]
	},
	{
		brickTypes: {
			a : 0xFF4040,	// aqua
			b : 0xFF9640,	// pink
			c : 0x33CCCC,	// purple
			d : 0x3339E639	// purple
		},
		levelDesign: [
			"",
			"",
			" ca ca ",
		]
	},
    {
        brickTypes: {
            a: colorSchemes.giantGoldfish[0],
            b: colorSchemes.giantGoldfish[4],
            c: colorSchemes.giantGoldfish[2],
            d: colorSchemes.giantGoldfish[1],
            e: colorSchemes.giantGoldfish[3],
            f: colorSchemes.giantGoldfish[5]
        },
        levelDesign: [
            "f",
            "f",
            "f",
            "   a   c bcd ba    da  a    ",
            "   c   a a   e c  e    b    ",
            "   b   c ea  cD   c bD c    ",
            "   d a e c   a b  d  a d    ",
            "    e b  eab de    ec  eab  ",
            "",
            "dc  adc a d  ed  cab ae  bB  d a ",
            "a e e   b e  b a b   e b a e e b ",
            "c a dc  c a  a e ab  ca  cb  a c ",
            "a c a   d c  e b d   a e d a  d  ",
            "de  ebd  e   ca  eac d c bc   e  ",
            "f",
            "f",
            "f"
        ]
    },
    // ATI: Currently this is the only level we use.  It starts out with just empty rows since the actual
    //  bricks are filled in with random patterns each level by the initBricks() method call. (See bricks.js)
    {
        brickTypes: {
            a: colorSchemes.giantGoldfish[0],
            b: colorSchemes.giantGoldfish[4],
            c: colorSchemes.giantGoldfish[2],
            d: colorSchemes.giantGoldfish[1],
            e: colorSchemes.giantGoldfish[3],
            // "f" bricks use the color that indicates they are unbreakable (gUnBreakableBrickColor).
            f: colorSchemes.giantGoldfish[5]
        },
        levelDesign: [
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f",
            "f"
        ]
    },
];