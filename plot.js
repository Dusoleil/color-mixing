import * as THREE from "three"
import WebGL from 'three/addons/capabilities/WebGL.js'
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js'
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js'
import {LineMaterial} from 'three/addons/lines/LineMaterial.js'
import {LineSegments2} from 'three/addons/lines/LineSegments2.js'
import {FontLoader} from 'three/addons/loaders/FontLoader.js'
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js'
import {Color} from "color"
import { getCurrentInstance } from 'vue'

export var font = (async function()
{
    let val = null;
    const loader = new FontLoader();
    return await new Promise((resolve) =>
    {
        loader.load('fonts/droid_sans_regular.typeface.json',(f)=>
        {
            resolve(f);
        });
    });
})();

export const webgl_support = WebGL.isWebGL2Available();

export var plot =
{
    data()
    {return{
        linear:false,
        renderer:webgl_support?new THREE.WebGLRenderer({antialias:true}):new SVGRenderer(),
        camera:new THREE.PerspectiveCamera(75,1,0.1,1000),
        pivot:new THREE.Object3D(),
        pivot_x:0,
        pivot_y:0,
        text_coords:[],
        obv:new ResizeObserver((entries) =>
        {
            if(this.$vuetify.display.mobile)
                this.renderer.setSize(325,325);
            else
                this.renderer.setSize(425,425);
            this.renderer.render(this.$scene,this.camera);
        })
    }},
    computed:
    {
        target()
        {
            return this.$store.state.target_color;
        },
        current()
        {
            return this.$store.state.current_color;
        },
        comp_colors()
        {
            return this.$store.state.comp_colors;
        },
        theme()
        {
            return this.$store.state.theme_name;
        }
    },
    watch:
    {
        target()
        {
            this.redraw();
        },
        current()
        {
            this.redraw();
        },
        theme()
        {
            this.renderer.setClearColor(this.$vuetify.theme.current.colors.surface);
            this.redraw();
        },
        linear()
        {
            this.redraw();
        }
    },
    methods:
    {
        color3(c)
        {
            let val = [];
            if(this.linear)
            {
                val.push(c.X);
                val.push(c.Y);
                val.push(c.Z);
            }
            else
            {
                val.push(c.a);
                val.push(c.L);
                val.push(-c.b);
            }
            val.push(c.hex);
            val.push(c.name);
            return val;
        },
        zoom()
        {
            const cur = this.color3(this.current);
            let min_x = cur[0];
            let max_x = cur[0];
            let min_y = cur[1];
            let max_y = cur[1];
            let min_z = cur[2];
            let max_z = cur[2];
            const color3 = this.color3;
            function bounds(c)
            {
                let b = color3(c);
                min_x = Math.min(min_x,b[0]);
                max_x = Math.max(max_x,b[0]);
                min_y = Math.min(min_y,b[1]);
                max_y = Math.max(max_y,b[1]);
                min_z = Math.min(min_z,b[2]);
                max_z = Math.max(max_z,b[2]);
            }
            bounds(this.target);
            for(const col of this.comp_colors)
                bounds(col);
            let origin = [(min_x+max_x)/2,(min_y+max_y)/2,(min_z+max_z)/2];
            let zoom_factor = this.linear ? 1.5 : 1.1;
            let diameter = Math.max(Math.max((max_x-min_x)*zoom_factor,(max_y-min_y)*zoom_factor),(max_z-min_z)*zoom_factor) + 10;
            this.pivot.position.set(origin[0],origin[1],origin[2]);
            this.camera.position.set(0,0,Math.max(15,((max_z-min_z)+diameter)/2));
            return [origin,diameter];
        },
        redraw()
        {
            this.text_coords = [];
            this.$scene.clear();
            this.$scene.add(this.pivot);
            this.plot_current();
            this.plot_target();
            this.plot_comp();
            let [origin,diameter] = this.zoom();
            this.draw_background_box(origin,diameter);
            this.draw_compass(origin,diameter);
            this.renderer.render(this.$scene,this.camera);
        },
        plot_hull(h)
        {
            for(const p of h)
            {
                this.plot_point(p);
            }
            if(h.length>1)
            {
                const vertices = [];
                if(h.length == 2 || h.length == 3)
                    for(const p of h)
                        vertices.push(new THREE.Vector3(p[0],p[1],p[2]));
                if(h.length == 3)
                    vertices.push(new THREE.Vector3(h[0][0],h[0][1],h[0][2]));
                if(h.length > 3)
                {
                    for(const p of h)
                        vertices.push(new THREE.Vector3(p[0],p[1],p[2]));
                    vertices.push(new THREE.Vector3(h[0][0],h[0][1],h[0][2]));
                    vertices.push(new THREE.Vector3(h[2][0],h[2][1],h[2][2]));
                    vertices.push(new THREE.Vector3(h[3][0],h[3][1],h[3][2]));
                    vertices.push(new THREE.Vector3(h[1][0],h[1][1],h[1][2]));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
                const material = new THREE.LineBasicMaterial({color:0x000000});
                const line = new THREE.Line(geometry,material);
                this.$scene.add(line);
            }
        },
        plot_comp()
        {
            let hull = [];
            for(const c of this.comp_colors)
                hull.push(this.color3(c));
            this.plot_hull(hull);
        },
        plot_point(p)
        {
            const vertices = [];
            vertices.push(new THREE.Vector3(p[0],p[1],p[2]));
            const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
            const material = new THREE.PointsMaterial({color:p[3], size:10.0, sizeAttenuation:false});
            const points = new THREE.Points(geometry, material);
            this.$scene.add( points );
            const text_geometry = new TextGeometry(p[4],{font:font,size:1.5,depth:0.2});
            const text_material = new THREE.MeshBasicMaterial({color: 0x222222});
            const text = new THREE.Mesh(text_geometry,text_material);
            let tp = new THREE.Vector3(p[0],p[1],p[2]);
            const leading = 1.6;
            adjust_text: while(true)
            {
                for(let etp of this.text_coords)
                {
                    if(tp.distanceTo(etp) < leading)
                    {
                        tp.sub(new THREE.Vector3(0,leading,0));
                        continue adjust_text;
                    }
                }
                this.text_coords.push(tp);
                break;
            }
            text.position.set(tp.x,tp.y,tp.z);
            text.rotateY(0.6);
            this.$scene.add(text);
        },
        plot_current()
        {
            this.plot_point(this.color3(this.current));
        },
        plot_target()
        {
            this.plot_point(this.color3(this.target));
        },
        draw_background_box(origin,diameter)
        {
            const sub_divide = 6;
            const sub_divide_sq = sub_divide*sub_divide;
            const cube_geometry = new THREE.BoxGeometry(diameter,diameter,diameter,sub_divide,sub_divide,sub_divide);
            cube_geometry.groups = [];
            for(let i = 0; i<6*sub_divide_sq;i++)
            {
                let idx = (i+Math.floor((i%sub_divide_sq)/sub_divide))%2;
                if(i < sub_divide_sq * 1) idx = -1;
                if(i >= sub_divide_sq * 2 && i < sub_divide_sq * 3) idx = -1;
                if(i >= sub_divide_sq * 4 && i < sub_divide_sq * 5) idx = -1;
                cube_geometry.addGroup(i*6,6,idx);
            }
            const cube_materials = [
                new THREE.MeshBasicMaterial({ color: 0xdddddd , side:THREE.DoubleSide}),
                new THREE.MeshBasicMaterial({ color: 0xbbbbbb , side:THREE.DoubleSide})
            ];
            let background_box = new THREE.Mesh(cube_geometry,cube_materials);
            background_box.position.set(origin[0],origin[1],origin[2]);
            background_box.renderOrder = -2;
            this.$scene.add(background_box);
        },
        draw_compass(origin,diameter)
        {
            if(webgl_support)
                diameter -= 0.5;
            const radius = (diameter / 2);
            const vorigin = new THREE.Vector3(origin[0],origin[1],origin[2]);
            const corner = vorigin.clone().sub(new THREE.Vector3(radius,radius,radius));
            const edge_x = corner.clone().add(new THREE.Vector3(diameter,0,0));
            const edge_y = corner.clone().add(new THREE.Vector3(0,diameter,0));
            const edge_z = corner.clone().add(new THREE.Vector3(0,0,diameter));
            let green = new THREE.Color(new Color("",[50,-127,128]).hex);
            let red = new THREE.Color(new Color("",[0,128,0]).hex);
            let black = new THREE.Color(new Color("",[0,0,0]).hex);
            let white = new THREE.Color(new Color("",[100,0,0]).hex);
            let yellow = new THREE.Color(new Color("",[100,0,128]).hex);
            let blue = new THREE.Color(new Color("",[50,0,-127]).hex);
            if(this.linear)
            {
                green = new THREE.Color(Color.from_xyz("",[0,0,0]).hex);
                red = new THREE.Color(Color.from_xyz("",[100,0,0]).hex);
                black = new THREE.Color(Color.from_xyz("",[0,0,0]).hex);
                white = new THREE.Color(Color.from_xyz("",[0,100,0]).hex);
                yellow = new THREE.Color(Color.from_xyz("",[0,0,0]).hex);
                blue = new THREE.Color(Color.from_xyz("",[0,0,100]).hex);
            }
            if(webgl_support)
            {
                const vertices = [];
                const colors = [];
                vertices.push(corner.x,corner.y,corner.z);
                colors.push(green.r,green.g,green.b);
                vertices.push(edge_x.x,edge_x.y,edge_x.z);
                colors.push(red.r,red.g,red.b);
                vertices.push(corner.x,corner.y,corner.z);
                colors.push(black.r,black.g,black.b);
                vertices.push(edge_y.x,edge_y.y,edge_y.z);
                colors.push(white.r,white.g,white.b);
                vertices.push(corner.x,corner.y,corner.z);
                colors.push(yellow.r,yellow.g,yellow.b);
                vertices.push(edge_z.x,edge_z.y,edge_z.z);
                colors.push(blue.r,blue.g,blue.b);
                const geometry = new LineSegmentsGeometry();
                geometry.setPositions(vertices);
                geometry.setColors(colors);
                const material = new LineMaterial({vertexColors: true, linewidth:6});
                const compass = new LineSegments2(geometry,material);
                this.$scene.add(compass);
            }
            else
            {
                const scene = this.$scene;
                function draw_line(p1,p2,c)
                {
                    const vertices = [];
                    vertices.push(p1.x,p1.y,p1.z);
                    vertices.push(p2.x,p2.y,p2.z);
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(vertices),3));
                    const material = new THREE.LineBasicMaterial({color:c,linewidth:4});
                    const line = new THREE.Line(geometry,material);
                    line.renderOrder = -1;
                    scene.add(line);
                }
                draw_line(corner,corner.clone().add(new THREE.Vector3(radius,0,0)),green);
                draw_line(corner.clone().add(new THREE.Vector3(radius,0,0)),edge_x,red);
                draw_line(corner,corner.clone().add(new THREE.Vector3(0,radius,0)),black);
                draw_line(corner.clone().add(new THREE.Vector3(0,radius,0)),edge_y,white);
                draw_line(corner,corner.clone().add(new THREE.Vector3(0,0,radius)),yellow);
                draw_line(corner.clone().add(new THREE.Vector3(0,0,radius)),edge_z,blue);
            }
        },
        spin_pivot(x,y)
        {
            let scale = -0.01;
            x *= scale;
            y *= scale;
            const min_x = 0;
            const max_x = Math.PI/2;
            const min_y = -Math.PI/4;
            const max_y = Math.PI/8;
            if(this.pivot_x + x < min_x)
                x = min_x - this.pivot_x;
            else if(this.pivot_x + x > max_x)
                x = max_x - this.pivot_x;
            if(this.pivot_y + y < min_y)
                y = min_y - this.pivot_y;
            else if(this.pivot_y + y > max_y)
                y = max_y - this.pivot_y;
            this.pivot_x += x;
            this.pivot_y += y;
            this.pivot.rotateOnWorldAxis(new THREE.Vector3(0,1,0),x);
            this.pivot.rotateX(y);
            this.renderer.render(this.$scene,this.camera);
        }
    },
    created()
    {
        getCurrentInstance().proxy.$scene = new THREE.Scene();
        this.renderer.setSize(400,400);
        this.renderer.setClearColor(this.$vuetify.theme.current.colors.surface);
        this.pivot.add(this.camera);
        this.camera.position.set(0,0,300);
        this.camera.lookAt(this.pivot.position);
        this.spin_pivot(-60,10);
    },
    async mounted()
    {
        font = await font;
        this.obv.observe(this.$el);
        const el = this.$el.querySelector(".plot");
        el.appendChild(this.renderer.domElement);
        let x = 0;
        let y = 0;
        let spinpos = (e) =>
        {
            if(e.touches)
            {
                let touch = e.touches[0];
                return [touch.clientX, touch.clientY];
            }
            else
            {
                return [e.clientX,e.clientY];
            }
        };
        let startspin = (e)=>
        {
            [x,y] = spinpos(e);
        };
        let spin = (e)=>
        {
            e.preventDefault();
            let [cx,cy] = spinpos(e);
            let dx = cx-x;
            let dy = cy-y;
            x = cx;
            y = cy;
            this.spin_pivot(dx,dy);
        };
        this.renderer.domElement.addEventListener('touchstart',startspin);
        this.renderer.domElement.addEventListener('touchmove',spin);
        this.renderer.domElement.addEventListener('mousedown',(e)=>
        {
            startspin(e);
            this.renderer.domElement.addEventListener('mousemove',spin);
        });
        window.addEventListener('mouseup',(e)=>
        {
            this.renderer.domElement.removeEventListener('mousemove',spin);
        });
        this.redraw();
    },
    unmounted()
    {
        this.obv.disconnect();
    },
    template:/*html*/`
        <v-card class="mb-4" elevation="10">
            <v-card-title class="d-flex">
                <span>Color Plot</span>
                <v-switch class="ml-auto" v-model="linear">
                    <template #prepend>Lab</template>
                    <template #append>XYZ</template>
                </v-switch>
            </v-card-title>
            <v-card-text>
                <div class="mx-auto plot" :style="{'max-width':'max-content'}"></div>
            </v-card-text>
        </v-card>`
}