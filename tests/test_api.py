import unittest
import math
import contextlib
import io
import re
from pathlib import Path

API = (Path(__file__).parents[1] / 'dist' / 'api.py').read_text(encoding='utf-8')

class GeometryTests(unittest.TestCase):
    def setUp(self):
        self.ns = {'t': 0, '_param_values': {}}
        exec(API, self.ns)

    def test_calculus(self):
        self.assertAlmostEqual(self.ns['integrate'](lambda x: x*x, 0, 1), 1/3, places=12)
        self.assertAlmostEqual(self.ns['derivative'](math.sin, 0), 1, places=8)
        self.assertAlmostEqual(self.ns['integrate'](math.sin, math.pi, 0), -2, places=9)

    def test_parameter_override_and_clamp(self):
        self.ns['_param_values'] = {'a': 7}
        self.assertEqual(self.ns['param']('a', 1, min=0, max=3), 3)
        with self.assertRaises(ValueError): self.ns['param']('invalid', min=1, max=0)
        with self.assertRaises(ValueError): self.ns['param']('a')

    def test_plot_domain_holes(self):
        result = self.ns['plot'](lambda x: 1/x, (-1, 1), samples=101)
        self.assertEqual(len(result['paths']), 2)
        self.assertTrue(all(math.isfinite(v) for p in result['paths'] for pt in p for v in pt))

    def test_surface_domain_holes(self):
        result = self.ns['surface'](lambda x,y: math.sqrt(x), (-1,1), (-1,1), resolution=4)
        self.assertEqual(len(result['positions']), 75)
        self.assertIn(None, result['positions'])

    def test_two_and_three_dimensions(self):
        self.assertEqual(self.ns['point']((1,2))['position'], [1,2,0])
        self.assertEqual(self.ns['point']((1,2,3))['position'], [1,2,3])
        self.assertEqual(self.ns['curve'](lambda u:(u,u*u), (0,1),samples=10)['paths'][0][-1], [1,1,0])
        with self.assertRaises(ValueError): self.ns['point']((1,))
        with self.assertRaises(ValueError): self.ns['point']((1,float('inf')))

    def test_geometry_and_limits(self):
        self.assertEqual(self.ns['vector']((0,0),(1,2))['end'], [1,2,0])
        self.assertEqual(len(self.ns['polygon']([(0,0),(1,0),(0,1)])['vertices']),3)
        with self.assertRaises(ValueError): self.ns['surface'](lambda x,y:x+y,resolution=1000)
        with self.assertRaises(ValueError): self.ns['plot'](lambda x:x,samples=1)
        with self.assertRaises(ValueError): self.ns['polygon']([(0,0)])

    def test_examples_compile(self):
        source = (Path(__file__).parents[1] / 'dist' / 'examples.js').read_text(encoding='utf-8')
        examples = re.findall(r'code:`([^`]+)`', source)
        self.assertEqual(len(examples), 6)
        for index, code in enumerate(examples):
            compile(code, f'example-{index}.py', 'exec')
            if 'import sympy' in code:
                continue
            for time in (0, 1.5):
                ns = {'t': time, '_param_values': {}}
                exec(API, ns)
                with contextlib.redirect_stdout(io.StringIO()):
                    exec(code, ns)
                self.assertGreater(len(ns['_objects']), 0)

    def test_new_examples_and_quantum_normalization(self):
        source = (Path(__file__).parents[1] / 'dist' / 'examples-v2.js').read_text(encoding='utf-8')
        examples = re.findall(r'code:`([^`]+)`', source)
        self.assertEqual(len(examples), 4)
        for code in examples:
            for time in (0, 2.5):
                ns = {'t': time, '_param_values': {}}
                exec(API, ns)
                with contextlib.redirect_stdout(io.StringIO()): exec(code, ns)
                self.assertGreater(len(ns['_objects']), 0)
                if 'def psi(' in code:
                    self.assertAlmostEqual(ns['norm'], 1.0, places=8)
                    self.assertLess(abs(ns['psi'](0)), 1e-12)
                    self.assertLess(abs(ns['psi'](ns['L'])), 1e-12)
                if 'polyhedron(ecken' in code:
                    self.assertEqual(len(ns['_objects']), 2)
                    self.assertEqual(len(ns['_objects'][0]['faces']), 18)

    def test_scatter_and_missing_dataset(self):
        result = self.ns['scatter']([[0,1],[2,3]], name='test')
        self.assertEqual(result['positions'], [0,1,0,2,3,0])
        self.assertEqual(result['kind'], 'scatter')
        with self.assertRaises(ValueError): self.ns['scatter']([[0,1]],size=100)
        with self.assertRaises(KeyError): self.ns['data']('fehlt')

if __name__ == '__main__':
    unittest.main()
