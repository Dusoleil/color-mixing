import * as THREE from "three"
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js'

export var plot =
{
    data()
    {return{
        renderer:new SVGRenderer(),
        scene:new THREE.Scene(),
        camera:new THREE.PerspectiveCamera(75,1,0.1,1000),
        pivot:new THREE.Object3D(),
        pivot_x:0,
        pivot_y:0,
        background_box:null,
        obv:new ResizeObserver((entries) =>
        {
            if(this.$vuetify.display.mobile)
                this.renderer.setSize(250,250);
            else
                this.renderer.setSize(500,500);
            this.renderer.render(this.scene,this.camera);
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
        }
    },
    methods:
    {
        redraw()
        {
            this.scene.clear();
            this.scene.add(this.pivot);
            this.draw_background_box();
            this.plot_current();
            this.plot_target();
            this.plot_comp();
            this.renderer.render(this.scene,this.camera);
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
                this.scene.add(line);
            }
        },
        plot_comp()
        {
            let hull = [];
            for(const c of this.comp_colors)
                hull.push([c.a,c.L,-c.b,c.hex]);
            this.plot_hull(hull);
        },
        plot_point(p)
        {
            const vertices = [];
            vertices.push(new THREE.Vector3(p[0],p[1],p[2]));
            const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
            const material = new THREE.PointsMaterial({color:p[3], size:10.0});
            const points = new THREE.Points(geometry, material);
            this.scene.add( points );
        },
        plot_current()
        {
            this.plot_point([this.current.a,this.current.L,-this.current.b,this.current.hex]);
        },
        plot_target()
        {
            this.plot_point([this.target.a,this.target.L,-this.target.b,this.target.hex]);
        },
        draw_background_box()
        {
            const sub_divide = 6;
            const sub_divide_sq = sub_divide*sub_divide;
            const cube_geometry = new THREE.BoxGeometry(260,260,260,sub_divide,sub_divide,sub_divide);
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
                new THREE.MeshBasicMaterial({ color: 0xffffff , side:THREE.DoubleSide}),
                new THREE.MeshBasicMaterial({ color: 0xbbbbbb , side:THREE.DoubleSide})
            ];
            this.background_box = new THREE.Mesh(cube_geometry,cube_materials);
            this.scene.add(this.background_box);
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
            this.renderer.render(this.scene,this.camera);
        }
    },
    created()
    {
        this.renderer.setSize(500,500);
        this.renderer.setClearColor(this.$vuetify.theme.current.colors.surface);
        this.pivot.add(this.camera);
        this.camera.position.set(0,0,300);
        this.camera.lookAt(this.pivot.position);
        this.spin_pivot(-60,10);
    },
    mounted()
    {
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
        <v-card title="Graph" class="mb-4" elevation="10"><v-card-text>
            <div class="mx-auto plot" :style="{'max-width':'max-content'}"></div>
        </v-card-text></v-card>`
}